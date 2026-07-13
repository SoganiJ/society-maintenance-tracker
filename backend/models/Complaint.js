const mongoose = require('mongoose');
const { COMPLAINT_STATUS, COMPLAINT_PRIORITY } = require('../config/constants');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary public_id, needed to delete on cleanup
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    // Free-text category validated against Settings.categories at the
    // controller/validator level, rather than a hard collection + $lookup —
    // categories are admin-editable but low-cardinality (see Settings model).
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: (arr) => arr.length <= 6,
        message: 'A complaint can have at most 6 images',
      },
      default: [],
    },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: COMPLAINT_PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.OPEN,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    // Denormalized for fast dashboard/list queries without joining
    // ComplaintHistory on every request; the authoritative audit trail
    // still lives in the ComplaintHistory collection.
    isOverdue: {
      type: Boolean,
      default: false,
    },
    overdueSince: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Dashboard/list queries filter by status and sort by recency constantly
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ raisedBy: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ isOverdue: 1 });
// Supports the "Natural Language / Search" resident + admin features
complaintSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Complaint', complaintSchema);
