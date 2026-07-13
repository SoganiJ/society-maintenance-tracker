const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { updateProfileValidator, updatePasswordValidator } = require('../validators/userValidators');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.patch(
  '/profile',
  upload.single('avatar'), // Accept a single file under the 'avatar' field
  updateProfileValidator,
  validate,
  userController.updateProfile
);

router.patch(
  '/password',
  updatePasswordValidator,
  validate,
  userController.updatePassword
);

module.exports = router;
