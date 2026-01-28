const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function checkTeacherStudents() {
    try {
        console.log('🔍 Checking teacher-student assignments...\n');

        // Find Sarvesh teacher
        const sarvesh = await User.findOne({ email: 'sarvesh@gmail.com' });

        if (!sarvesh) {
            console.log('❌ Sarvesh not found!');
            process.exit(1);
        }

        console.log('✅ Found Sarvesh:');
        console.log(`   Name: ${sarvesh.name}`);
        console.log(`   Email: ${sarvesh.email}`);
        console.log(`   Role: ${sarvesh.role}`);
        console.log(`   ID: ${sarvesh._id}\n`);

        // Find all students assigned to Sarvesh
        const students = await User.find({
            role: 'student',
            teacherId: sarvesh._id
        });

        console.log(`📊 Students assigned to Sarvesh: ${students.length}\n`);

        if (students.length === 0) {
            console.log('❌ No students found! Checking all students...\n');

            // Check ALL students
            const allStudents = await User.find({ role: 'student' });
            console.log(`Total students in DB: ${allStudents.length}\n`);

            if (allStudents.length > 0) {
                console.log('Students found:');
                allStudents.forEach(s => {
                    console.log(`   - ${s.name} (${s.email})`);
                    console.log(`     Teacher ID: ${s.teacherId || 'NOT SET'}`);
                    console.log(`     Status: ${s.status}\n`);
                });

                // Assign all students to Sarvesh
                console.log('🔧 Assigning all students to Sarvesh...\n');
                for (const student of allStudents) {
                    student.teacherId = sarvesh._id;
                    student.status = 'active';
                    await student.save();
                    console.log(`   ✓ Assigned ${student.name}`);
                }

                console.log('\n✅ All students assigned to Sarvesh!');
            }
        } else {
            console.log('Students:');
            students.forEach(s => {
                console.log(`   ✓ ${s.name} (${s.email}) - Class ${s.selectedClass || 'N/A'}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkTeacherStudents();
