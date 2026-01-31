const mongoose = require('mongoose');

const classroomSchema = mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    classNumber: { // e.g., 10, 12. "Class 10"
        type: Number,
        required: true
    },
    section: {
        type: String, // e.g., "A", "B" (Optional)
    },
    room: {
        type: String // Optional room number
    },
    gradient: {
        type: [String], // Array of 2 hex colors
        default: ['#6366F1', '#4F46E5']
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Classroom', classroomSchema);
