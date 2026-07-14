const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { uploadMany, deleteByPublicId } = require('../utils/cloudinaryUpload');
const { notify } = require('../services/notificationService');
const { getSettings } = require('../services/settingsService');
const { suggestMeantimeSolution, summarizeDescription } = require('../services/aiService');
const {
  sendComplaintCreatedEmail,
  sendComplaintUpdatedEmail,
  sendComplaintResolvedEmail,
} = require('../services/emailService');
const { ROLES, COMPLAINT_STATUS, NOTIFICATION_TYPE } = require('../config/constants');

const isAdmin = (user) => user.role === ROLES.ADMIN;

exports.suggestCategory = catchAsync(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required for AI suggestions.');
  }

  const suggestion = await suggestMeantimeSolution(title, description);

  res.status(200).json({
    success: true,
    data: { suggestion },
  });
});

exports.summarizeComplaint = catchAsync(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required for AI summary.');
  }

  const summary = await summarizeDescription(title, description);

  res.status(200).json({
    success: true,
    data: { summary },
  });
});

exports.createComplaint = catchAsync(async (req, res) => {
  const { title, description, category, priority } = req.body;

  const settings = await getSettings();
  if (!settings.categories.includes(category)) {
    throw new ApiError(400, `Category must be one of: ${settings.categories.join(', ')}`);
  }

  const images = req.files?.length ? await uploadMany(req.files, 'complaints') : [];

  const complaint = await Complaint.create({
    title,
    description,
    category,
    priority,
    images,
    raisedBy: req.user._id,
  });

  await ComplaintHistory.create({
    complaint: complaint._id,
    status: complaint.status,
    note: 'Complaint raised',
    actor: req.user._id,
  });

  sendComplaintCreatedEmail(req.user, complaint);

  res.status(201).json({ success: true, message: 'Complaint raised successfully.', data: { complaint } });
});

exports.getComplaints = catchAsync(async (req, res) => {
  const { status, priority, category, search, page = 1, limit = 10, sort = '-createdAt' } = req.query;

  const filter = {};
  if (!isAdmin(req.user)) filter.raisedBy = req.user._id;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;

  // Enforce strict sorting for admins: Status (Open > In Progress > Resolved > Closed), then Priority (Urgent > High > Medium > Low)
  // This applies regardless of the requested sort to guarantee the visual grouping.
  let finalSort = sort;
  if (isAdmin(req.user)) {
    finalSort = '-statusWeight -priorityWeight -isOverdue -createdAt';
  } else if (sort === '-createdAt') {
    finalSort = '-statusWeight -priorityWeight -createdAt';
  }

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('raisedBy', 'name flatNumber')
      .populate('assignedTo', 'name phone')
      .sort(finalSort)
      .skip(skip)
      .limit(Number(limit)),
    Complaint.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      complaints,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    },
  });
});

exports.getComplaint = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid complaint id.');

  const complaint = await Complaint.findById(id)
    .populate('raisedBy', 'name flatNumber email')
    .populate('assignedTo', 'name phone skills');

  if (!complaint) throw new ApiError(404, 'Complaint not found.');
  if (!isAdmin(req.user) && String(complaint.raisedBy._id) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have access to this complaint.');
  }

  const history = await ComplaintHistory.find({ complaint: id })
    .populate('actor', 'name role')
    .sort('createdAt');

  res.status(200).json({ success: true, data: { complaint, history } });
});

exports.updateStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, note = '' } = req.body;

  const complaint = await Complaint.findById(id).populate('raisedBy', 'name email');
  if (!complaint) throw new ApiError(404, 'Complaint not found.');

  complaint.status = status;
  if (status === COMPLAINT_STATUS.RESOLVED) complaint.resolvedAt = new Date();
  if (status === COMPLAINT_STATUS.CLOSED) complaint.closedAt = new Date();
  if (status === COMPLAINT_STATUS.OPEN || status === COMPLAINT_STATUS.IN_PROGRESS) {
    complaint.isOverdue = false;
    complaint.overdueSince = null;
  }
  await complaint.save();

  await ComplaintHistory.create({ complaint: id, status, note, actor: req.user._id });

  await notify({
    user: complaint.raisedBy._id,
    type: NOTIFICATION_TYPE.COMPLAINT_UPDATE,
    title: 'Complaint status updated',
    message: `"${complaint.title}" is now ${status}.`,
    relatedComplaint: complaint._id,
  });

  if (status === COMPLAINT_STATUS.RESOLVED) {
    sendComplaintResolvedEmail(complaint.raisedBy, complaint);
  } else {
    sendComplaintUpdatedEmail(complaint.raisedBy, complaint, note);
  }

  res.status(200).json({ success: true, message: 'Status updated.', data: { complaint } });
});

exports.assignComplaint = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { priority, assignedTo } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.');

  if (assignedTo) {
    const Worker = require('../models/Worker');
    const assignee = await Worker.findById(assignedTo);
    if (!assignee) throw new ApiError(400, 'assignedTo must be a valid worker.');
    complaint.assignedTo = assignedTo;
  }
  if (priority) complaint.priority = priority;

  await complaint.save();

  await ComplaintHistory.create({
    complaint: id,
    status: complaint.status,
    note: `Updated priority/assignment`,
    actor: req.user._id,
  });

  res.status(200).json({ success: true, message: 'Complaint updated.', data: { complaint } });
});

exports.toggleOverdue = catchAsync(async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id);

  if (!complaint) throw new ApiError(404, 'Complaint not found.');
  if (complaint.status === 'resolved' || complaint.status === 'closed') {
    throw new ApiError(400, 'Cannot flag resolved or closed complaints as overdue.');
  }

  const { getSettings } = require('../services/settingsService');
  const settings = await getSettings();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.overdueDays);

  if (new Date(complaint.createdAt) > cutoffDate) {
    throw new ApiError(400, `Complaint must be open for more than ${settings.overdueDays} days to be flagged as overdue.`);
  }

  complaint.isOverdue = !complaint.isOverdue;
  if (complaint.isOverdue) {
    complaint.overdueSince = new Date();
  } else {
    complaint.overdueSince = null;
  }

  await complaint.save();

  await ComplaintHistory.create({
    complaint: id,
    status: complaint.status,
    note: complaint.isOverdue ? 'Flagged as overdue by admin' : 'Removed overdue flag',
    actor: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: complaint.isOverdue ? 'Flagged as overdue' : 'Removed overdue flag',
    data: { complaint }
  });
});

exports.deleteComplaint = catchAsync(async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.');

  await Promise.all(complaint.images.map((img) => deleteByPublicId(img.publicId)));
  await ComplaintHistory.deleteMany({ complaint: id });
  await complaint.deleteOne();

  res.status(200).json({ success: true, message: 'Complaint deleted.' });
});

exports.getStats = catchAsync(async (req, res) => {
  const filter = isAdmin(req.user) ? {} : { raisedBy: req.user._id };

  const [statusCounts, priorityCounts, categoryCounts, overdueCount, totalCount] = await Promise.all([
    Complaint.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: filter }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: filter }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Complaint.countDocuments({ ...filter, isOverdue: true }),
    Complaint.countDocuments(filter),
  ]);

  const toMap = (arr) => arr.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});

  res.status(200).json({
    success: true,
    data: {
      total: totalCount,
      overdue: overdueCount,
      byStatus: toMap(statusCounts),
      byPriority: toMap(priorityCounts),
      byCategory: toMap(categoryCounts),
    },
  });
});
