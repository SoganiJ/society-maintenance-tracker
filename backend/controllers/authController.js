const User = require('../models/User');
const Session = require('../models/Session');
const OTPToken = require('../models/OTPToken');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateRawToken, hashToken } = require('../utils/hash');
const { sendPasswordResetEmail } = require('../services/emailService');

const REFRESH_COOKIE_NAME = 'smt_refresh';
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  path: '/api/auth',
};

/**
 * Issues an access token + refresh token, persists a Session record for
 * the refresh token (so it can be revoked independently of other
 * devices), and sets the refresh token as an httpOnly cookie.
 */
const issueTokens = async (user, req, res) => {
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  await Session.create({
    user: user._id,
    refreshTokenHash: hashToken(refreshToken),
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.ip,
    expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_MS),
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  return accessToken;
};

exports.register = catchAsync(async (req, res) => {
  const { name, email, password, flatNumber, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({ name, email, password, flatNumber, phone });
  const accessToken = await issueTokens(user, req, res);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user: user.toSafeObject(), accessToken },
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact the society admin.');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await issueTokens(user, req, res);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: { user: user.toSafeObject(), accessToken },
  });
});

exports.refresh = catchAsync(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    throw new ApiError(401, 'No refresh token found. Please log in again.');
  }

  const decoded = verifyRefreshToken(refreshToken); // throws on invalid/expired

  const session = await Session.findOne({
    user: decoded.id,
    refreshTokenHash: hashToken(refreshToken),
    isRevoked: false,
  });
  if (!session || session.expiresAt < new Date()) {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Account no longer available.');
  }

  const accessToken = signAccessToken(user._id, user.role);
  res.status(200).json({
    success: true,
    message: 'Token refreshed.',
    data: { user: user.toSafeObject(), accessToken },
  });
});

exports.logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  if (refreshToken) {
    await Session.updateOne(
      { refreshTokenHash: hashToken(refreshToken) },
      { $set: { isRevoked: true } }
    );
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(200).json({ success: true, message: 'Logged out.' });
});

exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return the same response whether or not the account exists,
  // so this endpoint can't be used to enumerate registered emails.
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const rawToken = generateRawToken();
  await OTPToken.create({
    user: user._id,
    tokenHash: hashToken(rawToken),
    purpose: 'password_reset',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user, resetUrl);

  res.status(200).json(genericResponse);
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  const otpRecord = await OTPToken.findOne({
    tokenHash: hashToken(token),
    purpose: 'password_reset',
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new ApiError(400, 'This reset link is invalid or has expired.');
  }

  const user = await User.findById(otpRecord.user);
  if (!user) {
    throw new ApiError(400, 'This reset link is no longer valid.');
  }

  user.password = password;
  await user.save();

  otpRecord.used = true;
  await otpRecord.save();

  // Reset all other sessions so a stolen device gets logged out
  await Session.updateMany({ user: user._id }, { $set: { isRevoked: true } });

  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
});
