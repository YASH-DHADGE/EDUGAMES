const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
require('dotenv').config();

const restoreUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ MongoDB Connected');

        const email = 'divyeshravane21543@gmail.com';
        const password = 'password123'; // Default password from seed
        // OR if they used a specific one: 'AVRavr@22' from logs
        const passwordActual = 'AVRavr@22';

        const existing = await User.findOne({ email });
        if (existing) {
            console.log('User already exists');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(passwordActual, 10);

        // Find a teacher to assign to
        const teacher = await User.findOne({ role: 'teacher' });

        await User.create({
            name: 'Divyesh Ravane',
            email: email,
            password: hashedPassword,
            role: 'student',
            status: 'active',
            selectedClass: 10,
            teacherId: teacher ? teacher._id : null,
            learnerCategory: 'fast',
            xp: 2000,
            streak: 5
        });

        console.log(`✓ User ${email} recreated successfully with password: ${passwordActual}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

restoreUser();
