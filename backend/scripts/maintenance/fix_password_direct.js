const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function fixPasswordDirectly() {
    try {
        const sarvesh = await User.findOne({ email: 'sarvesh@gmail.com' });

        if (!sarvesh) {
            console.log('Not found!');
            process.exit(1);
        }

        console.log('Found:', sarvesh.email);

        // Hash password manually OUTSIDE of model
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Update directly to avoid pre-save hook
        await User.updateOne(
            { email: 'sarvesh@gmail.com' },
            { $set: { password: hashedPassword } }
        );

        console.log('Password updated directly!');

        // Verify
        const updated = await User.findOne({ email: 'sarvesh@gmail.com' });
        const test = await updated.matchPassword('password123');
        console.log('Test:', test ? '✅ WORKS' : '❌ FAILED');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixPasswordDirectly();
