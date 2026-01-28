const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function verifyUser() {
    try {
        console.log('🔍 Verifying Divyesh login...\n');

        // Find user
        const user = await User.findOne({ email: 'divyesh@student.edu' });

        if (!user) {
            console.log('❌ User NOT found in database!');
            process.exit(1);
        }

        console.log('✅ User found!');
        console.log('   Name:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Status:', user.status);
        console.log('   Selected Class:', user.selectedClass);
        console.log('   Teacher ID:', user.teacherId);
        console.log('   Password Hash:', user.password.substring(0, 20) + '...');
        console.log('');

        // Test password
        const testPassword = 'password123';
        console.log(`🔐 Testing password: "${testPassword}"`);

        const isMatch = await bcrypt.compare(testPassword, user.password);

        if (isMatch) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password does NOT match!');
            console.log('\n🔧 Fixing password...');

            // Fix the password
            const hashedPassword = await bcrypt.hash('password123', 10);
            user.password = hashedPassword;
            await user.save();

            console.log('✅ Password updated!');

            // Verify again
            const isMatchNow = await bcrypt.compare('password123', user.password);
            console.log('✅ Password verification:', isMatchNow ? 'SUCCESS' : 'FAILED');
        }

        console.log('\n📝 Login Credentials:');
        console.log('   Email: divyesh@student.edu');
        console.log('   Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyUser();
