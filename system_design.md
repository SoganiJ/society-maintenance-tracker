# System Design: Society Maintenance Tracker

This document outlines the architectural decisions for four core backend sub-systems of the Society Maintenance Tracker application.

## 1. Complaint History Model

The complaint history tracking is designed around an **append-only event log** pattern. 

### Architecture
Instead of embedding a timeline array within the main `Complaint` document, historical events are stored in a dedicated `ComplaintHistory` collection. Each document in this collection represents a discrete status change or note.

- **Data Integrity**: This decoupled approach ensures the timeline is immutable and never lost, even if the primary `Complaint` document requires trimming or archiving. 
- **Query Optimization**: The `ComplaintHistory` schema uses a compound index on `{ complaint: 1, createdAt: 1 }`, allowing the timeline UI to fetch events in chronological order via highly efficient, localized queries.

## 2. Overdue Detection

The SLA (Service Level Agreement) enforcement relies on a combination of **denormalized indexing** and an **asynchronous worker**.

### Architecture
The `Complaint` model holds two denormalized fields: `isOverdue` (Boolean) and `overdueSince` (Date). These fields are indexed to allow rapid querying on the dashboard without expensive, on-the-fly time calculations for every request.

- **Background Worker**: A scheduled background job (via `node-cron`) acts as the overdue scanner. 
- **Dynamic SLA**: The job retrieves the configurable SLA timeframe from the application settings (the `Settings` model).
- **Execution Flow**: It calculates a cutoff date and scans the database for open or in-progress complaints older than this date that are not yet flagged. Once identified, it updates the `isOverdue` flag, pushes a note to the `ComplaintHistory` event log, and triggers notifications for all system admins.

## 3. Photo Handling

Media uploads for complaints are handled using a **stream-based, memory-only** pipeline to Cloudinary.

### Architecture
To avoid the I/O overhead and security implications of writing temporary files to the server's disk, the photo upload process leverages `multer` with a memory storage engine.

- **Streaming Pipeline**: The backend service receives the file buffer in memory and immediately pipes it into `cloudinary.uploader.upload_stream`.
- **Database Schema**: Once uploaded, the `Complaint` model persists the secure URL and the Cloudinary `public_id` within a bounded sub-schema (max 6 images per complaint). Storing the `public_id` is critical as it enables reliable cleanup and hard-deletions on Cloudinary when a complaint is eventually removed.

## 4. Notification Flow

The notification subsystem is designed as an **internal, polling-friendly data store**, decoupling the event producer from the presentation layer.

### Architecture
When an event occurs (e.g., a complaint is flagged as overdue), the relevant service invokes a lightweight `notificationService`.

- **Storage**: The notification is stored in the `Notification` collection. The schema acts as a universal inbox, capturing the target user, event type, text content, and read-status.
- **Polymorphic Linking**: To support actionable notifications, the schema includes optional references (`relatedComplaint`, `relatedNotice`). Keeping these as standard reference fields rather than a discriminator union simplifies populating deep-links within the frontend's notification bell.
- **Indexing**: A compound index on `{ user: 1, isRead: 1, createdAt: -1 }` guarantees that the client's notification bell queries ("get my unread notifications, newest first") remain highly performant as the collection grows.
