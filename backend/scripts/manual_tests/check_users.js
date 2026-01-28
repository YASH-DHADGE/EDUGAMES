const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function checkUsers() {
    try {
        console.log('📋 Checking all users in database...\n');

        const teachers = await User.find({ role: 'teacher' }).select('name email status');
        const students = await User.find({ role: 'student' }).select('name email teacherId');

        console.log(`👨‍🏫 Teachers (${teachers.length}):`);
        teachers.forEach(t => {
            console.log(`   ${t.name} (${t.email}) - Status: ${t.status}`);
        });

        console.log(`\n👨‍🎓 Students (${students.length}):`);
        students.forEach(s => {
            console.log(`   ${s.name} (${s.email}) - Teacher ID: ${s.teacherId}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
