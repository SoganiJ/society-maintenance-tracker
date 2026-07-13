const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { uploadBuffer, deleteByPublicId } = require('../utils/cloudinaryUpload');

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, phone, flatNumber } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Update fields
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (flatNumber) user.flatNumber = flatNumber;

  // Handle avatar upload if provided
  if (req.file) {
    // If the user already has an avatar, delete the old one from Cloudinary
    if (user.avatar?.publicId) {
      await deleteByPublicId(user.avatar.publicId);
    }
    
    // Upload new avatar to the 'avatars' folder
    const uploaded = await uploadBuffer(req.file.buffer, 'avatars');
    user.avatar = {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toSafeObject() },
  });
});

exports.updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Set new password
  user.password = newPassword;
  await user.save();

  // (Optional) We could revoke all other sessions here by updating the Session collection,
  // but for this implementation we'll just return success.

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});
