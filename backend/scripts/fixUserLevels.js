const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Fix all user levels based on their current XP with 150 XP per level
async function fixUserLevels() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all users with XP
        const users = await User.find({ role: 'student' });
        console.log(`Found ${users.length} students to check`);

        let updated = 0;
        for (const user of users) {
            const correctLevel = Math.floor(user.xp / 150) + 1;

            if (user.level !== correctLevel) {
                console.log(`Updating ${user.name}: XP=${user.xp}, Old Level=${user.level}, New Level=${correctLevel}`);
                user.level = correctLevel;
                await user.save();
                updated++;
            }
        }

        console.log(`\n✅ Fixed ${updated} user levels`);
        process.exit(0);
    } catch (error) {
        console.error('Error fixing user levels:', error);
        process.exit(1);
    }
}

fixUserLevels();
