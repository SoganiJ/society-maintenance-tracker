const mongoose = require('mongoose');
const { NOTICE_TYPE } = require('../config/constants');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true,
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    type: {
      type: String,
      enum: Object.values(NOTICE_TYPE),
      default: NOTICE_TYPE.GENERAL,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null, // null = does not expire
    },
  },
  { timestamps: true }
);

// Notice board always sorts pinned-first, then most recent
noticeSchema.index({ isPinned: -1, createdAt: -1 });
noticeSchema.index({ type: 1 });
noticeSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Notice', noticeSchema);
