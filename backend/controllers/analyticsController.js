const User = require('../models/User');
// const QuizResult = require('../models/QuizResult'); // Assuming we have this, or we use User.assignments
// const LessonProgress = require('../models/LessonProgress'); // Assuming we have this

exports.getStudentAnalytics = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await User.findById(studentId).select('-password')
            .populate('assignments.quizId')
            .populate('assignments.chapterId')
            .populate('assignments.teacherChapterId');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Calculate stats from assignments
        const completedAssignments = student.assignments.filter(a => a.status === 'completed');
        const pendingAssignments = student.assignments.filter(a => a.status === 'pending');

        // Calculate average score (mock for now as we don't store scores in assignments yet, only status)
        // Future: Add score field to assignments or separate QuizResult model
        const averageScore = 0;

        // Recent Activity
        const recentActivity = student.assignments
            .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
            .slice(0, 5)
            .map(a => ({
                type: a.type,
                title: a.quizId?.title || a.chapterId?.name || a.teacherChapterId?.title || 'Unknown Task',
                date: a.assignedAt,
                status: a.status
            }));

        // XP History
        let xpHistory = [];
        if (student.xpHistory && student.xpHistory.length > 0) {
            // Get last 7 days
            const last7Days = student.xpHistory
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(-7);

            xpHistory = last7Days.map(entry => ({
                date: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }),
                xp: entry.xp
            }));
        } else {
            // Fallback if no history
            xpHistory = [
                { date: 'Mon', xp: 0 },
                { date: 'Tue', xp: 0 },
                { date: 'Wed', xp: 0 },
                { date: 'Thu', xp: 0 },
                { date: 'Fri', xp: 0 },
                { date: 'Sat', xp: 0 },
                { date: 'Sun', xp: student.xp || 0 }
            ];
        }

        const analytics = {
            xp: student.xp || 0,
            streak: student.streak || 0,
            level: student.level || 1,
            lessonsCompleted: completedAssignments.length,
            quizzesTaken: completedAssignments.filter(a => a.type === 'quiz').length,
            averageScore: averageScore,
            recentActivity,
            xpHistory
        };

        res.json(analytics);
    } catch (error) {
        console.error('Error fetching student analytics:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getClassAnalytics = async (req, res) => {
    try {
        const { classId } = req.params;

        let query = { role: 'student' };
        if (classId && classId !== 'all') {
            query.selectedClass = classId;
        }

        const students = await User.find(query).select('-password');

        const classAnalytics = students.map(student => {
            const completed = student.assignments ? student.assignments.filter(a => a.status === 'completed').length : 0;
            const pending = student.assignments ? student.assignments.filter(a => a.status === 'pending').length : 0;

            return {
                id: student._id,
                name: student.name,
                email: student.email,
                xp: student.xp || 0,
                streak: student.streak || 0,
                completedTasks: completed,
                pendingTasks: pending,
                lastActive: student.updatedAt // Approximate last active
            };
        });

        // Sort by XP (Leaderboard style)
        classAnalytics.sort((a, b) => b.xp - a.xp);

        res.json(classAnalytics);
    } catch (error) {
        console.error('Error fetching class analytics:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
