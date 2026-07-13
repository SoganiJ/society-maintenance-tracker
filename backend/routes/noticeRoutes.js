const express = require('express');
const noticeController = require('../controllers/noticeController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const {
  createNoticeValidator,
  updateNoticeValidator,
  listNoticesValidator,
} = require('../validators/noticeValidators');

const router = express.Router();

// All notice routes require authentication
router.use(protect);

// Read routes — any authenticated user
router.get('/', listNoticesValidator, validate, noticeController.getNotices);
router.get('/:id', noticeController.getNotice);

// Write routes — admin only
router.post(
  '/',
  restrictTo(ROLES.ADMIN),
  createNoticeValidator,
  validate,
  noticeController.createNotice
);
router.patch(
  '/:id',
  restrictTo(ROLES.ADMIN),
  updateNoticeValidator,
  validate,
  noticeController.updateNotice
);
router.delete('/:id', restrictTo(ROLES.ADMIN), noticeController.deleteNotice);

module.exports = router;
