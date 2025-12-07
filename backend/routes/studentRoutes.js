const express = require('express');
const router = express.Router();
const { getStudentTasks, getQuizById, submitQuizResult, getClassroomContent } = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

router.get('/tasks', protect, getStudentTasks);
router.get('/classroom', protect, getClassroomContent);
router.get('/quiz/:id', protect, getQuizById);
router.post('/quiz/submit', protect, submitQuizResult);

module.exports = router;
