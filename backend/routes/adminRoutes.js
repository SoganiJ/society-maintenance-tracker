const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const {
  listResidentsValidator,
  updateResidentValidator,
  updateSettingsValidator,
  exportComplaintsValidator,
} = require('../validators/adminValidators');

const router = express.Router();

// Every admin route requires authentication + admin role
router.use(protect, restrictTo(ROLES.ADMIN));

// Dashboard
router.get('/dashboard-stats', adminController.getDashboardStats);

// Residents
router.get('/residents', listResidentsValidator, validate, adminController.getResidents);
router.get('/residents/:id', adminController.getResident);
router.patch(
  '/residents/:id',
  updateResidentValidator,
  validate,
  adminController.updateResident
);

// Complaints export
router.get(
  '/complaints/export',
  exportComplaintsValidator,
  validate,
  adminController.exportComplaints
);

// Settings
router.get('/settings', adminController.getSettings);
router.patch('/settings', updateSettingsValidator, validate, adminController.updateSettingsHandler);

// Workers
router.get('/workers', adminController.getWorkers);
router.post('/workers', adminController.createWorker);
router.delete('/workers/:id', adminController.deleteWorker);

// AI Agent
router.get('/agent/consult/:id', adminController.consultAgent);

module.exports = router;
