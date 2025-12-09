const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth'); // Assuming we want to protect this

// POST /api/ai/chat
router.post('/chat', protect, aiController.askGemini);

module.exports = router;
