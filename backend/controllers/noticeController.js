const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { notify } = require('../services/notificationService');
const { sendNoticeEmail } = require('../services/emailService');
const { ROLES, NOTICE_TYPE, NOTIFICATION_TYPE } = require('../config/constants');

const isAdmin = (user) => user.role === ROLES.ADMIN;

/**
 * Create a new notice (admin only).
 * All active residents are notified via in-app notification and email
 * for every notice created by the admin.
 */
exports.createNotice = catchAsync(async (req, res) => {
  const { title, content, type, isPinned, expiresAt } = req.body;

  const notice = await Notice.create({
    title,
    content,
    type: type || NOTICE_TYPE.GENERAL,
    isPinned: isPinned || false,
    expiresAt: expiresAt || null,
    createdBy: req.user._id,
  });

  // Notify all residents for EVERY notice (as per user request)
  const residents = await User.find({ role: ROLES.RESIDENT, isActive: true }).select(
    'name email'
  );

  const notificationPromises = residents.map((resident) =>
    notify({
      user: resident._id,
      type: NOTIFICATION_TYPE.NOTICE,
      title: `New notice: ${notice.title}`,
      message:
        notice.content.length > 120
          ? `${notice.content.substring(0, 120)}…`
          : notice.content,
      relatedNotice: notice._id,
    })
  );

  const emailPromises = residents.map((resident) =>
    sendNoticeEmail(resident, notice)
  );

  // Fire-and-forget: don't block the response
  Promise.allSettled([...notificationPromises, ...emailPromises]);

  const populated = await Notice.findById(notice._id).populate('createdBy', 'name role');

  res
    .status(201)
    .json({ success: true, message: 'Notice created successfully.', data: { notice: populated } });
});

/**
 * List notices with pagination, search and type filter.
 * For residents, expired notices are automatically excluded.
 * Pinned notices always appear first.
 */
exports.getNotices = catchAsync(async (req, res) => {
  const { type, search, page = 1, limit = 10 } = req.query;

  const filter = {};

  // Residents don't see expired notices
  if (!isAdmin(req.user)) {
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  }

  if (type) filter.type = type;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .populate('createdBy', 'name role')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notice.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notices,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Get a single notice by ID.
 */
exports.getNotice = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid notice id.');

  const notice = await Notice.findById(id).populate('createdBy', 'name role');
  if (!notice) throw new ApiError(404, 'Notice not found.');

  // Block resident access to expired notices
  if (
    !isAdmin(req.user) &&
    notice.expiresAt &&
    new Date(notice.expiresAt) < new Date()
  ) {
    throw new ApiError(404, 'Notice not found.');
  }

  res.status(200).json({ success: true, data: { notice } });
});

/**
 * Update a notice (admin only).
 */
exports.updateNotice = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid notice id.');

  const allowedFields = ['title', 'content', 'type', 'isPinned', 'expiresAt'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const notice = await Notice.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name role');

  if (!notice) throw new ApiError(404, 'Notice not found.');

  res.status(200).json({ success: true, message: 'Notice updated.', data: { notice } });
});

/**
 * Delete a notice (admin only).
 */
exports.deleteNotice = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid notice id.');

  const notice = await Notice.findByIdAndDelete(id);
  if (!notice) throw new ApiError(404, 'Notice not found.');

  res.status(200).json({ success: true, message: 'Notice deleted.' });
});
