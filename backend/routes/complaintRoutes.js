const express = require('express');
const complaintController = require('../controllers/complaintController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');
const {
  createComplaintValidator,
  updateStatusValidator,
  assignValidator,
  listComplaintsValidator,
} = require('../validators/complaintValidators');

const router = express.Router();

router.use(protect);

router.get('/stats', complaintController.getStats);
router.post('/ai-suggest', complaintController.suggestCategory);
router.post('/ai-summarize', restrictTo(ROLES.ADMIN), complaintController.summarizeComplaint);
router.get('/', listComplaintsValidator, validate, complaintController.getComplaints);
router.post(
  '/',
  upload.array('images', 6),
  createComplaintValidator,
  validate,
  complaintController.createComplaint
);
router.get('/:id', complaintController.getComplaint);

router.patch(
  '/:id/status',
  restrictTo(ROLES.ADMIN),
  updateStatusValidator,
  validate,
  complaintController.updateStatus
);
router.patch(
  '/:id/assign',
  restrictTo(ROLES.ADMIN),
  assignValidator,
  validate,
  complaintController.assignComplaint
);
router.patch(
  '/:id/overdue',
  restrictTo(ROLES.ADMIN),
  complaintController.toggleOverdue
);
router.delete('/:id', restrictTo(ROLES.ADMIN), complaintController.deleteComplaint);

module.exports = router;
