const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function showAllTeachers() {
    try {
        console.log('\n📋 ALL TEACHER ACCOUNTS:\n');

        const teachers = await User.find({ role: 'teacher' });

        for (const teacher of teachers) {
            console.log(`👨‍🏫 ${teacher.name}`);
            console.log(`   Email: ${teacher.email}`);
            console.log(`   ID: ${teacher._id}`);
            console.log(`   Status: ${teacher.status}`);

            // Count students
            const studentCount = await User.countDocuments({
                role: 'student',
                teacherId: teacher._id
            });

            console.log(`   Students: ${studentCount}`);

            // Test password
            const testPassword = 'password123';
            const isMatch = await teacher.matchPassword(testPassword);
            console.log(`   Password "${testPassword}": ${isMatch ? '✅ WORKS' : '❌ WRONG'}`);
            console.log('');
        }

        // Show all students
        console.log('\n👨‍🎓 ALL STUDENTS:\n');
        const students = await User.find({ role: 'student' });

        students.forEach(s => {
            console.log(`  ${s.name} (${s.email})`);
            console.log(`    Teacher: ${s.teacherId || 'NONE'}`);
            console.log(`    Status: ${s.status}`);
            console.log('');
        });

        console.log('\n✅ RECOMMENDED LOGIN:');
        console.log('   Email: sarvesh@gmail.com');
        console.log('   Password: password123\n');

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error.message);
        process.exit(1);
    }
}

showAllTeachers();
