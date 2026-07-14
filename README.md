# Society Maintenance Tracker

A comprehensive, modern full-stack web application designed for residential societies to effortlessly manage, track, and resolve maintenance complaints, backed by AI-powered tools.

## 🚀 Key Features

### 👤 For Residents
- **AI Chatbot**: Instantly log complaints through a conversational AI interface. The chatbot understands natural language and auto-fills ticket categories and descriptions.
- **Complaint Tracking**: Real-time status tracking (Open, In Progress, Resolved) and timeline history for all raised issues.
- **Notice Board**: Stay up to date with society announcements (General, Important, Pinned) directly from the dashboard.
- **Image Uploads**: Attach visual proof of the issue via Cloudinary-backed image uploads.

### 🛡️ For Admins
- **Interactive Dashboard**: View system health at a glance (Open, Progress, Resolved, Overdue metrics).
- **Automated Overdue Flagging**: Complaints that stay open beyond a configurable number of days are automatically flagged as 🚨 Overdue and surface to the top of the admin queue.
- **AI Summarization**: Instantly summarize long, verbose resident complaints into quick bullet points with a single click using the Groq AI integration.
- **WhatsApp Automation**: Assign a worker to a task and immediately open a pre-filled WhatsApp message containing all the necessary complaint details directly to the worker's phone.
- **Full Ticket Lifecycle Control**: Change priority, status, and append internal notes for auditing.
- **Worker Management**: Maintain a directory of facility workers with direct Call and WhatsApp shortcuts.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, React Router, Axios, CSS (Custom Design System)
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies
- **AI Integrations**: 
  - **Groq API** (Llama3-8b) for the AI Resident Chatbot and Admin Summarization.
- **File Storage**: Cloudinary for image hosting
- **Email Delivery**: Nodemailer (SMTP)
  > **Note regarding Email Delivery:** The email verification and delivery feature (using Nodemailer) has been fully implemented in the codebase. However, if you are testing a live deployed version on platforms like Render, the emails may fail to send. This is a known infrastructure issue because platforms like Render often block outbound SMTP ports on their free tiers to prevent spam. The email functionality works perfectly when the application is run locally.
  > 
  > **Alternatives / Fixes:**
  > - **Upgrade Hosting Plan:** Upgrading to a paid tier on Render (or your chosen host) typically removes these outbound port restrictions.
  > - **Alternative Hosting:** Deploy the backend on a VPS or platform that does not aggressively block SMTP ports (e.g., DigitalOcean, AWS EC2, or Railway).
  > - **Third-Party Email APIs:** Instead of raw SMTP with Nodemailer, you can integrate dedicated email APIs like SendGrid, Resend, or Amazon SES, which operate over standard HTTP/HTTPS ports (80/443) and are not blocked by free-tier hosts.

---

## 🗄️ Database Schema

The database utilizes MongoDB and consists of the following primary collections:

1. **User**: Stores resident and admin accounts.
   - `name`, `email`, `password`, `role` (resident/admin), `flatNumber`, `isEmailVerified`
2. **Complaint**: The core ticketing model.
   - `title`, `description`, `category`, `status` (open, in_progress, resolved, closed), `priority`
   - `images` (array of Cloudinary URLs), `isOverdue`, `overdueSince`
   - **Relations**: `raisedBy` (User), `assignedTo` (Worker)
3. **ComplaintHistory**: An audit trail of every action taken on a complaint.
   - `complaint` (Complaint ID), `status`, `note`, `actor` (User ID), `timestamp`
4. **Worker**: Directory of maintenance staff.
   - `name`, `phone`, `skills`, `isActive`
5. **Notice**: Announcements posted by the admin.
   - `title`, `content`, `type` (general, important, pinned), `expiresAt`
6. **Settings**: Dynamic system configurations (like categories and overdue threshold).

---

## ⚙️ Local Setup Guide

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas cluster)

### 2. Clone and Install
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables

#### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory using the provided `.env.example`:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=your_groq_api_key
```

#### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Seeding (First Run Only)
To log into the system, you'll need an initial Admin account. Run the seed script to generate the default admin.
```bash
cd backend
node scripts/seedAdmin.js
```
*Check the console output for the generated admin email and password.*

### 5. Example Login Credentials
Once seeded, you can log in as an admin using the default credentials:
- **Admin Email**: `admin@society.com`
- **Admin Password**: `Admin@1234`

*To test the Resident view, simply click "Register" on the login screen and create a new account.*

### 6. Start the Application
Run both servers concurrently.
```bash
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`.

---

## 📡 API Documentation Overview

The backend exposes a RESTful API under `/api`.

### Authentication (`/api/auth`)
- `POST /register`: Register a new resident.
- `POST /login`: Authenticate and receive JWT HTTP-only cookies.
- `POST /logout`: Clear session cookies.
- `GET /me`: Get current authenticated user profile.

### Complaints (`/api/complaints`)
- `GET /`: List complaints (supports filtering by `status`, `priority`, `category`, `date`, `search`).
- `GET /stats`: Retrieve dashboard analytics.
- `POST /`: Create a new complaint (supports `multipart/form-data` for images).
- `GET /:id`: Get specific complaint details & timeline history.
- `PATCH /:id/status`: Update the status and append an audit note (Admin only).
- `PATCH /:id/assign`: Assign a worker and/or change priority (Admin only).
- `PATCH /:id/overdue`: Manually toggle the 🚨 Overdue flag (Admin only).

### AI Integrations (`/api/complaints/ai-...`)
- `POST /ai-suggest`: Chatbot endpoint to suggest a complaint category and auto-draft descriptions based on conversational input.
- `POST /ai-summarize`: Generates a bulleted summary of a lengthy complaint description using Groq.

### Admin Tools (`/api/admin`)
- `GET /workers`: List all facility workers.
- `POST /workers`: Add a new worker to the directory.
- `GET /users`: List all residents.

### Notices (`/api/notices`)
- `GET /`: Retrieve active notices (sorted by Pinned > Important > General).
- `POST /`: Create a new notice (Admin only).
- `DELETE /:id`: Delete a notice (Admin only).
