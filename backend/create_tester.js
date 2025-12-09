const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rural_learning_db');

async function createTester() {
    try {
        const email = 'chatbot_tester@test.com';
        const password = 'password123';

        await User.deleteOne({ email });

        // Pass plain password, let Schema pre-save hook handle hashing
        const user = await User.create({
            name: 'Chatbot Tester',
            email,
            password: password,
            role: 'student',
            status: 'active',
            selectedClass: 6,
            xp: 0,
            streak: 0
        });


        console.log('✅ Tester created:', user.email);

        // Verify immediately
        const isMatch = await user.matchPassword(password);
        console.log('🔐 Immediate password check:', isMatch);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

createTester();
