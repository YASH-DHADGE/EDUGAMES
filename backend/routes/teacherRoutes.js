const express = require('express');
const router = express.Router();
const { getTeacherStats, createQuiz, assignQuiz, assignChapter, createChapter, assignCustomChapter, getMyContent, getStudents, createStudent, deleteQuiz, updateQuiz, deleteChapter, getAllChapters, getStudentsByClass, deleteStudent, updateStudent, createClassroom, getMyClassrooms, deleteClassroom, addStudentToClassroom, removeStudentFromClassroom, getClassroom } = require('../controllers/teacherController');
const { protect, teacherOnly } = require('../middleware/auth');

router.get('/stats', protect, teacherOnly, getTeacherStats);
router.get('/content', protect, teacherOnly, getMyContent);
router.get('/students', protect, teacherOnly, getStudents); // My Students
router.get('/students/class/:classNumber', protect, teacherOnly, getStudentsByClass); // Class Filter
router.get('/chapters', protect, teacherOnly, getAllChapters); // Syllabus Chapters
router.post('/student', protect, teacherOnly, createStudent);
router.delete('/student/:id', protect, teacherOnly, deleteStudent);
router.put('/student/:id', protect, teacherOnly, updateStudent); // New Route
router.post('/quiz', protect, teacherOnly, createQuiz);
router.delete('/quiz/:id', protect, teacherOnly, deleteQuiz);
router.put('/quiz/:id', protect, teacherOnly, updateQuiz);
router.post('/assign-quiz', protect, teacherOnly, assignQuiz);
router.post('/assign-chapter', protect, teacherOnly, assignChapter);
router.post('/chapter', protect, teacherOnly, createChapter);
router.post('/assign-custom-chapter', protect, teacherOnly, assignCustomChapter);
router.post('/classroom', protect, teacherOnly, createClassroom);
router.post('/classroom/add-student', protect, teacherOnly, addStudentToClassroom);
router.delete('/classroom/:classroomId/student/:studentId', protect, teacherOnly, removeStudentFromClassroom);
router.get('/classrooms', protect, teacherOnly, getMyClassrooms);
router.get('/classroom/:id', protect, teacherOnly, getClassroom);
router.delete('/classroom/:id', protect, teacherOnly, deleteClassroom); // Add delete
router.delete('/chapter/:id', protect, teacherOnly, deleteChapter);

module.exports = router;
