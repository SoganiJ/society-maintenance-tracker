const mongoose = require('mongoose');
const { DEFAULT_OVERDUE_DAYS } = require('../config/constants');

/**
 * Singleton collection — exactly one document, enforced by always
 * upserting against a fixed key rather than creating new documents.
 * See services/settingsService.js (Admin/Settings step) for the
 * getSettings()/updateSettings() helpers that enforce this.
 */
const settingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: 'GLOBAL',
      unique: true,
    },
    societyName: {
      type: String,
      trim: true,
      default: 'My Society',
    },
    overdueDays: {
      type: Number,
      default: DEFAULT_OVERDUE_DAYS,
      min: [1, 'Overdue threshold must be at least 1 day'],
    },
    categories: {
      type: [String],
      default: ['Plumbing', 'Electrical', 'Housekeeping', 'Security', 'Structural', 'Other'],
    },
    supportEmail: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
