const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin', 'institute'], default: 'student' },
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    status: { type: String, enum: ['pending', 'active', 'rejected', 'disabled'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    language: { type: String, default: 'en' },
    learnerCategory: { type: String, enum: ['slow', 'fast', 'neutral'], default: 'neutral' },
    selectedClass: { type: Number, min: 6, max: 12, default: null },

    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignments: [{
        type: { type: String, enum: ['chapter', 'quiz', 'teacherChapter'], default: 'chapter' },
        chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherQuiz' },
        teacherChapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherChapter' },
        assignedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
    }],

    // XP and Level
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastXpUpdate: { type: Date, default: Date.now },

    // Streak Tracking
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    streakHistory: [{ date: Date, active: Boolean }],

    // XP History
    xpHistory: [{
        date: { type: Date, default: Date.now },
        xp: { type: Number, default: 0 }
    }],

    // Profile Customization
    avatar: { type: String, default: null },
    themeColor: { type: String, default: '#6366F1' },

    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
