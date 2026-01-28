const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function fixPassword() {
    try {
        const sarvesh = await User.findOne({ email: 'sarvesh@gmail.com' });

        if (!sarvesh) {
            console.log('Not found!');
            process.exit(1);
        }

        console.log('Found:', sarvesh.email);

        // Set plain password - model will hash it
        sarvesh.password = 'password123';
        await sarvesh.save();

        console.log('Password updated!');

        // Test it
        const test = await sarvesh.matchPassword('password123');
        console.log('Test:', test ? 'WORKS' : 'FAILED');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixPassword();
