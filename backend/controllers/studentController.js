const User = require('../models/User');
const TeacherQuiz = require('../models/TeacherQuiz');

// @desc    Get assigned tasks for student
// @route   GET /api/student/tasks
// @access  Private/Student
const getStudentTasks = async (req, res) => {
    try {
        const student = await User.findById(req.user._id)
            .populate({
                path: 'assignments.chapterId',
                select: 'title subject classNumber'
            })
            .populate({
                path: 'assignments.quizId',
                select: 'title subject classNumber'
            })
            .populate({
                path: 'assignments.teacherChapterId',
                select: 'title subject classNumber content'
            });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Format tasks
        const tasks = student.assignments.map(assignment => {
            if (assignment.type === 'quiz' && assignment.quizId) {
                return {
                    id: assignment._id,
                    type: 'quiz',
                    quizId: assignment.quizId._id,
                    title: assignment.quizId.title,
                    subject: assignment.quizId.subject,
                    classNumber: assignment.quizId.classNumber,
                    assignedAt: assignment.assignedAt,
                    status: assignment.status
                };
            } else if (assignment.type === 'teacherChapter' && assignment.teacherChapterId) {
                return {
                    id: assignment._id,
                    type: 'teacherChapter',
                    chapterId: assignment.teacherChapterId._id,
                    title: assignment.teacherChapterId.title,
                    content: assignment.teacherChapterId.content,
                    subject: assignment.teacherChapterId.subject,
                    classNumber: assignment.teacherChapterId.classNumber,
                    assignedAt: assignment.assignedAt,
                    status: assignment.status
                };
            } else if (assignment.chapterId) {
                return {
                    id: assignment._id,
                    type: 'chapter',
                    chapterId: assignment.chapterId._id,
                    chapterName: assignment.chapterId.title,
                    subject: assignment.chapterId.subject,
                    classNumber: assignment.chapterId.classNumber,
                    assignedAt: assignment.assignedAt,
                    status: assignment.status
                };
            }
            return null;
        }).filter(task => task !== null);

        // Sort by date (newest first)
        tasks.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching student tasks:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get quiz by ID
// @route   GET /api/student/quiz/:id
// @access  Private/Student
const getQuizById = async (req, res) => {
    try {
        const quiz = await TeacherQuiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit quiz result and mark assignment as completed
// @route   POST /api/student/quiz/submit
// @access  Private/Student
const submitQuizResult = async (req, res) => {
    try {
        console.log('DEBUG: submitQuizResult called with body:', req.body);
        const { quizId, assignmentId, score, totalQuestions } = req.body;
        const student = await User.findById(req.user._id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the assignment
        let assignment;
        console.log('DEBUG: Student assignments count:', student.assignments.length);
        console.log('DEBUG: Available Assignment IDs:', student.assignments.map(a => a._id.toString()));

        if (assignmentId) {
            assignment = student.assignments.id(assignmentId);
            console.log('DEBUG: Looked for assignmentId:', assignmentId, 'Found:', !!assignment);
        }

        // Fallback or validation
        if (!assignment && quizId) {
            console.log('DEBUG: Fallback search by quizId:', quizId);
            assignment = student.assignments.find(
                a => a.quizId && a.quizId.toString() === quizId && a.status === 'pending'
            );
            console.log('DEBUG: Fallback Found:', !!assignment);
        }

        if (assignment) {
            console.log('DEBUG: Assignment found, updating status. ID:', assignment._id);
            assignment.status = 'completed';
            // You could also save the score here if the schema supported it
            await student.save();
            console.log('DEBUG: Student saved successfully');
            res.json({ message: 'Quiz submitted and assignment marked completed', xpGained: 0 }); // XP handled by xpController usually
        } else {
            // Even if not found (maybe already completed?), we accept the submission log
            res.json({ message: 'Quiz result logged (no pending assignment found)' });
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all classroom content (chapters & quizzes) for the student's class
// @route   GET /api/student/classroom
// @access  Private/Student
const getClassroomContent = async (req, res) => {
    try {
        const student = await User.findById(req.user._id);
        if (!student || !student.selectedClass) {
            return res.status(400).json({ message: 'Student class not found' });
        }

        const classNumber = String(student.selectedClass);
        const TeacherChapter = require('../models/TeacherChapter');
        const TeacherQuiz = require('../models/TeacherQuiz');

        const chapters = await TeacherChapter.find({ classNumber })
            .select('title subject content createdAt teacherId')
            .populate('teacherId', 'name');

        const quizzes = await TeacherQuiz.find({ classNumber })
            .select('title subject description questions createdAt teacherId')
            .populate('teacherId', 'name');

        // Combine and format
        const content = [
            ...chapters.map(c => ({
                id: c._id,
                type: 'chapter',
                title: c.title,
                subtitle: c.subject, // Map subject to subtitle
                description: c.content ? c.content.substring(0, 100) + '...' : '', // Preview
                fullContent: c.content,
                teacher: c.teacherId ? c.teacherId.name : 'Unknown',
                date: c.createdAt,
                icon: 'book-open-page-variant'
            })),
            ...quizzes.map(q => ({
                id: q._id,
                type: 'quiz',
                title: q.title,
                subtitle: q.subject,
                description: q.description || `${q.questions.length} Questions`,
                teacher: q.teacherId ? q.teacherId.name : 'Unknown',
                date: q.createdAt,
                icon: 'format-list-checks',
                questions: q.questions // Include questions for rendering/navigating
            }))
        ];

        // Sort by date descending
        content.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(content);
    } catch (error) {
        console.error('Error fetching classroom content:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getStudentTasks,
    getQuizById,
    submitQuizResult,
    getClassroomContent
};
