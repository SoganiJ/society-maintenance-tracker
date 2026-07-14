const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const ComplaintHistory = require('../models/ComplaintHistory');
const Worker = require('../models/Worker');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getSettings, updateSettings } = require('../services/settingsService');
const { ROLES, COMPLAINT_STATUS, COMPLAINT_PRIORITY } = require('../config/constants');
const { consultAdminAgent } = require('../services/aiService');

/* ──────────────────────────────────────────────────────────────
   RESIDENT MANAGEMENT
   ────────────────────────────────────────────────────────────── */

/**
 * List residents with search, active-filter, and pagination.
 */
exports.getResidents = catchAsync(async (req, res) => {
  const { search, isActive, role, page = 1, limit = 15 } = req.query;

  const filter = {};

  // Exclude the requesting admin from the list
  filter._id = { $ne: req.user._id };

  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (role) filter.role = role;

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { flatNumber: regex }];
  }

  const skip = (page - 1) * limit;

  const [residents, total] = await Promise.all([
    User.find(filter)
      .select('-password -passwordChangedAt -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      residents,
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
 * Get a single resident with their complaint statistics.
 */
exports.getResident = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid resident id.');

  const resident = await User.findById(id).select('-password -passwordChangedAt -__v');
  if (!resident) throw new ApiError(404, 'Resident not found.');

  // Aggregate their complaint stats
  const [complaintStats] = await Complaint.aggregate([
    { $match: { raisedBy: resident._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.OPEN] }, 1, 0] } },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.IN_PROGRESS] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.RESOLVED] }, 1, 0] },
        },
        closed: { $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.CLOSED] }, 1, 0] } },
        overdue: { $sum: { $cond: ['$isOverdue', 1, 0] } },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      resident,
      complaintStats: complaintStats || {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        overdue: 0,
      },
    },
  });
});

/**
 * Update a resident's status or role (admin only).
 */
exports.updateResident = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid resident id.');

  const resident = await User.findById(id);
  if (!resident) throw new ApiError(404, 'Resident not found.');



  // Prevent admin from demoting themselves
  if (String(resident._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot modify your own account from this panel.');
  }

  const { isActive, role } = req.body;
  if (isActive !== undefined) resident.isActive = isActive;
  if (role) resident.role = role;

  await resident.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Resident updated.',
    data: { resident: resident.toSafeObject() },
  });
});

/* ──────────────────────────────────────────────────────────────
   DASHBOARD STATS
   ────────────────────────────────────────────────────────────── */

/**
 * Aggregated dashboard statistics for the admin panel.
 */
exports.getDashboardStats = catchAsync(async (req, res) => {
  const [
    totalResidents,
    activeResidents,
    totalComplaints,
    statusCounts,
    priorityCounts,
    overdueCount,
    totalNotices,
    unreadNotifications,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.RESIDENT }),
    User.countDocuments({ role: ROLES.RESIDENT, isActive: true }),
    Complaint.countDocuments(),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Complaint.countDocuments({ isOverdue: true }),
    Notice.countDocuments(),
    Notification.countDocuments({ isRead: false }),
  ]);

  const toMap = (arr) => arr.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});

  res.status(200).json({
    success: true,
    data: {
      residents: { total: totalResidents, active: activeResidents },
      complaints: {
        total: totalComplaints,
        overdue: overdueCount,
        byStatus: toMap(statusCounts),
        byPriority: toMap(priorityCounts),
      },
      notices: { total: totalNotices },
      notifications: { unread: unreadNotifications },
    },
  });
});

/* ──────────────────────────────────────────────────────────────
   CSV EXPORT
   ────────────────────────────────────────────────────────────── */

/**
 * Export complaints as CSV with optional filters.
 */
exports.exportComplaints = catchAsync(async (req, res) => {
  const { startDate, endDate, status, priority, category } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const complaints = await Complaint.find(filter)
    .populate('raisedBy', 'name flatNumber email')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .lean();

  // Build CSV
  const headers = [
    'ID',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Raised By',
    'Flat',
    'Email',
    'Assigned To',
    'Overdue',
    'Created',
    'Resolved',
  ];

  const escapeField = (val) => {
    const str = val == null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = complaints.map((c) =>
    [
      c._id,
      c.title,
      c.category,
      c.priority,
      c.status,
      c.raisedBy?.name || '',
      c.raisedBy?.flatNumber || '',
      c.raisedBy?.email || '',
      c.assignedTo?.name || '',
      c.isOverdue ? 'Yes' : 'No',
      c.createdAt ? new Date(c.createdAt).toISOString() : '',
      c.resolvedAt ? new Date(c.resolvedAt).toISOString() : '',
    ]
      .map(escapeField)
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=complaints_${new Date().toISOString().slice(0, 10)}.csv`
  );
  res.status(200).send(csv);
});

/* ──────────────────────────────────────────────────────────────
   SETTINGS
   ────────────────────────────────────────────────────────────── */

exports.getSettings = catchAsync(async (req, res) => {
  const settings = await getSettings();
  res.status(200).json({ success: true, data: { settings } });
});

exports.updateSettingsHandler = catchAsync(async (req, res) => {
  const { overdueDays, categories } = req.body;
  const updates = {};
  if (overdueDays !== undefined) updates.overdueDays = overdueDays;
  if (categories !== undefined) updates.categories = categories;

  const settings = await updateSettings(updates);
  res.status(200).json({ success: true, message: 'Settings updated.', data: { settings } });
});

// ==========================================
// WORKER DIRECTORY MANAGEMENT
// ==========================================

exports.getWorkers = catchAsync(async (req, res) => {
  const workers = await Worker.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: workers });
});

exports.createWorker = catchAsync(async (req, res) => {
  const { phone } = req.body;
  if (phone) {
    const existingWorker = await Worker.findOne({ phone });
    if (existingWorker) {
      throw new ApiError(400, 'A worker with this phone number already exists.');
    }
  }
  const worker = await Worker.create(req.body);
  res.status(201).json({ success: true, data: worker });
});

exports.deleteWorker = catchAsync(async (req, res) => {
  await Worker.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Worker deleted' });
});

// ==========================================
// ADMIN AI AGENT (COPILOT)
// ==========================================

exports.consultAgent = catchAsync(async (req, res) => {
  const complaintId = req.params.id;
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const workers = await Worker.find();
  const agentResponse = await consultAdminAgent(complaint, workers);

  res.status(200).json({
    success: true,
    data: agentResponse,
  });
});
