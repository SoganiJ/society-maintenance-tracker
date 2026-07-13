const { body, query } = require('express-validator');
const { NOTICE_TYPE } = require('../config/constants');

exports.createNoticeValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 3000 })
    .withMessage('Content cannot exceed 3000 characters'),
  body('type')
    .optional()
    .isIn(Object.values(NOTICE_TYPE))
    .withMessage(`Type must be one of: ${Object.values(NOTICE_TYPE).join(', ')}`),
  body('isPinned').optional().isBoolean().withMessage('isPinned must be a boolean'),
  body('expiresAt')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('expiresAt must be a valid ISO 8601 date'),
];

exports.updateNoticeValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty')
    .isLength({ max: 3000 })
    .withMessage('Content cannot exceed 3000 characters'),
  body('type')
    .optional()
    .isIn(Object.values(NOTICE_TYPE))
    .withMessage(`Type must be one of: ${Object.values(NOTICE_TYPE).join(', ')}`),
  body('isPinned').optional().isBoolean().withMessage('isPinned must be a boolean'),
  body('expiresAt')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('expiresAt must be a valid ISO 8601 date'),
];

exports.listNoticesValidator = [
  query('type').optional().isIn(Object.values(NOTICE_TYPE)),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
];
