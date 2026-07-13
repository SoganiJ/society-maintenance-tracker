const { body, query } = require('express-validator');
const { COMPLAINT_STATUS, COMPLAINT_PRIORITY } = require('../config/constants');

exports.createComplaintValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)).withMessage('Invalid priority'),
];

exports.updateStatusValidator = [
  body('status').isIn(Object.values(COMPLAINT_STATUS)).withMessage('Invalid status'),
  body('note').optional().trim().isLength({ max: 500 }),
];

exports.assignValidator = [
  body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)).withMessage('Invalid priority'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid user id'),
];

exports.listComplaintsValidator = [
  query('status').optional().isIn(Object.values(COMPLAINT_STATUS)),
  query('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
