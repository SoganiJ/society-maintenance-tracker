const mongoose = require('mongoose');
const { COMPLAINT_STATUS } = require('../config/constants');

/**
 * Append-only log: one document per status change or note. The
 * Complaint Timeline UI reads this collection directly rather than an
 * embedded array, so history is never lost even if a complaint document
 * itself needs to be trimmed or archived later.
 */
const complaintHistorySchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Timeline is always fetched "all events for this complaint, oldest first"
complaintHistorySchema.index({ complaint: 1, createdAt: 1 });

module.exports = mongoose.model('ComplaintHistory', complaintHistorySchema);
