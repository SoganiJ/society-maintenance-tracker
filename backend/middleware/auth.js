const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Verifies the Bearer access token, loads the user, and rejects requests
 * from deactivated accounts or tokens issued before a password change.
 */
exports.protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(new ApiError(401, 'You are not logged in. Please log in to continue.'));
  }

  const decoded = verifyAccessToken(token); // throws JsonWebTokenError/TokenExpiredError on failure

  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user) {
    return next(new ApiError(401, 'The user for this token no longer exists.'));
  }

  if (!user.isActive) {
    return next(new ApiError(403, 'Your account has been deactivated. Contact the society admin.'));
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new ApiError(401, 'Password was changed recently. Please log in again.'));
  }

  req.user = user;
  next();
});

/**
 * Usage: restrictTo('admin') or restrictTo('admin', 'resident')
 * Must run after `protect`.
 */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
