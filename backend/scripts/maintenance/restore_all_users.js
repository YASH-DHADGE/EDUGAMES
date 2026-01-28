const mongoose = require('mongoose');
const User = require('../../models/User');
require('dotenv').config();

const usersToRestore = [
    {
        role: 'admin',
        email: 'admin@system.in',
        password: 'Admin@123',
        name: 'System Admin',
        status: 'active'
    },
    {
        role: 'institute',
        email: 'pccoer@gmail.com',
        password: 'pccoer',
        name: 'PCCOER Institute',
        status: 'active',
        // Address/City might be needed but generic defaults should work based on schema
    },
    {
        role: 'teacher',
        email: 'sarvesh@gmail.com',
        password: 'AVRavr@22',
        name: 'Sarvesh Teacher',
        status: 'active',
        xp: 5000
    },
    {
        role: 'student',
        email: 'divyeshravane21543@gmail.com',
        password: 'AVRavr@22',
        name: 'Divyesh Ravane',
        status: 'active',
        selectedClass: 10,
        learnerCategory: 'fast',
        xp: 2000,
        streak: 5,
        // teacherId will be set dynamically
    }
];

const restoreAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ MongoDB Connected');

        let teacherId = null;

        // 1. Restore Admin, Institute, Teacher (Order matters for teacherId)
        // We'll process them in order of the array, but let's make sure Teacher is before Student.
        // Array order above is: Admin, Institute, Teacher, Student. This works.

        for (const userData of usersToRestore) {
            console.log(`\nProcessing ${userData.role}: ${userData.email}...`);

            let user = await User.findOne({ email: userData.email });

            // Prepare data
            const updateData = { ...userData };
            if (userData.role === 'student' && teacherId) {
                updateData.teacherId = teacherId;
            }

            if (user) {
                console.log(`   User exists. Updating credentials and details...`);
                // Update fields
                Object.assign(user, updateData);
                // Explicitly mark password as modified if we want to ensure it's re-hashed (if changed)
                // However, user.save() will only hash if we modify the field. 
                // Since we are doing `user.password = userData.password`, it counts as modification.
                // The pre-save hook will hash it.
                user.password = userData.password;

                await user.save();
                console.log(`   ✓ Updated successfully.`);
            } else {
                console.log(`   User missing. Creating new...`);
                user = await User.create(updateData);
                console.log(`   ✓ Created successfully.`);
            }

            // Capture ID for dependencies
            if (userData.role === 'teacher') {
                teacherId = user._id;
                console.log(`   (Saved Teacher ID for students)`);
            }

            // Verify Login (Password Match)
            const isMatch = await user.matchPassword(userData.password);
            console.log(`   Login Check: ${isMatch ? 'PASS ✅' : 'FAIL ❌'}`);
        }

        console.log('\nAll users processed.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

restoreAll();
