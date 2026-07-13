const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // SHA-256 hash of the token/OTP that was emailed out — the raw value
    // is never stored, matching the pattern used for password hashing.
    tokenHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['password_reset', 'email_verification'],
      default: 'password_reset',
    },
    used: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpTokenSchema.index({ user: 1, purpose: 1 });
// TTL index: MongoDB automatically deletes the document once expiresAt passes —
// no cron job needed to clean up stale reset tokens.
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTPToken', otpTokenSchema);
