const { body, query, param } = require('express-validator');
const { ROLES } = require('../config/constants');

exports.listResidentsValidator = [
  query('search').optional().trim(),
  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  query('role').optional().isIn(Object.values(ROLES)),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

exports.updateResidentValidator = [
  param('id').isMongoId().withMessage('Invalid resident id'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
];

exports.updateSettingsValidator = [
  body('overdueDays')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Overdue days must be between 1 and 90')
    .toInt(),
  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one category is required'),
  body('categories.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
];

exports.exportComplaintsValidator = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('status').optional(),
  query('priority').optional(),
  query('category').optional(),
];
