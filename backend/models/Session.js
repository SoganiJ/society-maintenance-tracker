const mongoose = require('mongoose');

/**
 * One document per logged-in device. Backs "persistent login" (the
 * refresh token lives here, not just in a cookie) and lets a user or
 * admin revoke a single session without invalidating every device.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // SHA-256 hash of the refresh token — never store the raw token,
    // mirroring OTPToken's approach.
    refreshTokenHash: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    ip: {
      type: String,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, isRevoked: 1 });
// TTL index: expired sessions are swept automatically by MongoDB
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
