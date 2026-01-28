const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function assignStudentsToAllTeachers() {
    try {
        console.log('🔄 Assigning students to all teachers...\n');

        // Get all teachers
        const teachers = await User.find({ role: 'teacher', status: 'active' });
        console.log(`Found ${teachers.length} teachers`);

        // Get all students
        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students\n`);

        if (teachers.length === 0) {
            console.log('❌ No teachers found!');
            process.exit(1);
        }

        if (students.length === 0) {
            console.log('❌ No students found!');
            process.exit(1);
        }

        // Distribute students evenly among all teachers
        let assignmentCount = {};

        for (let i = 0; i < students.length; i++) {
            const teacherIndex = i % teachers.length; // Round-robin
            const teacher = teachers[teacherIndex];

            students[i].teacherId = teacher._id;
            await students[i].save();

            // Track count
            if (!assignmentCount[teacher.name]) {
                assignmentCount[teacher.name] = 0;
            }
            assignmentCount[teacher.name]++;

            console.log(`✓ Assigned ${students[i].name} to ${teacher.name}`);
        }

        console.log('\n📊 Distribution Summary:');
        Object.keys(assignmentCount).forEach(teacherName => {
            console.log(`   ${teacherName}: ${assignmentCount[teacherName]} students`);
        });

        console.log('\n🎉 All students assigned successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

assignStudentsToAllTeachers();
