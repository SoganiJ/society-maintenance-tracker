const express = require('express');
const { protect } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.use(protect); // Ensure only logged in users can chat
router.post('/chat', aiController.chat);

module.exports = router;
