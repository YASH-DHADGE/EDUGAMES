const express = require('express');
const router = express.Router();
const { saveGameResult, getHighscores, getGameConfig, getGameContent, getUserGameStats } = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

router.get('/config', getGameConfig);
router.get('/content', getGameContent);
router.post('/result', protect, saveGameResult);
router.get('/user-stats', protect, getUserGameStats); // New route
router.get('/highscores', getHighscores);

module.exports = router;
