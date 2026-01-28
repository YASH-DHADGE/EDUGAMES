const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function debugTeacher() {
    try {
        console.log('\n=== DEBUGGING TEACHER-STUDENT ISSUE ===\n');

        // 1. Find Sarvesh
        const sarvesh = await User.findOne({ email: 'sarvesh@gmail.com' });

        if (!sarvesh) {
            console.log('❌ Sarvesh (@gmail.com) NOT FOUND!');

            // Check for other Sarvesh accounts
            const otherSarvesh = await User.find({ email: /sarvesh/i });
            console.log(`\nFound ${otherSarvesh.length} accounts with "sarvesh":`);
            otherSarvesh.forEach(t => {
                console.log(`  - ${t.email} (ID: ${t._id}, Role: ${t.role})`);
            });
            process.exit(1);
        }

        console.log('✅ SARVESH FOUND:');
        console.log(`   Email: ${sarvesh.email}`);
        console.log(`   Name: ${sarvesh.name}`);
        console.log(`   Role: ${sarvesh.role}`);
        console.log(`   ID: ${sarvesh._id}`);
        console.log('');

        // 2. Find students assigned to this teacher ID
        const students = await User.find({
            role: 'student',
            teacherId: sarvesh._id
        });

        console.log(`📊 STUDENTS WITH teacherId = ${sarvesh._id}: ${students.length}`);
        console.log('');

        if (students.length > 0) {
            students.forEach(s => {
                console.log(`  ✓ ${s.name}`);
                console.log(`    Email: ${s.email}`);
                console.log(`    Teacher ID: ${s.teacherId}`);
                console.log(`    Status: ${s.status}`);
                console.log(`    Class: ${s.selectedClass || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('❌ NO STUDENTS FOUND!\n');

            // Check all students
            const allStudents = await User.find({ role: 'student' });
            console.log(`Total students in database: ${allStudents.length}\n`);

            if (allStudents.length > 0) {
                console.log('All students:');
                allStudents.forEach(s => {
                    console.log(`  - ${s.name} (${s.email})`);
                    console.log(`    Teacher ID: ${s.teacherId || 'NULL'}`);
                    console.log(`    Match: ${s.teacherId?.toString() === sarvesh._id.toString()}`);
                    console.log('');
                });
            }
        }

        // 3. Test the exact query the backend uses
        console.log('\n=== TESTING BACKEND QUERY ===');
        console.log('Query:', JSON.stringify({ role: 'student', teacherId: sarvesh._id }));

        const backendQuery = await User.find({
            role: 'student',
            teacherId: sarvesh._id
        }).select('-password').sort({ createdAt: -1 });

        console.log(`Result count: ${backendQuery.length}`);

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

debugTeacher();
