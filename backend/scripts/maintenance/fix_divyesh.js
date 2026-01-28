const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');
const GameResult = require('./models/GameResult');

async function recreateDivyesh() {
    try {
        console.log('🔄 Recreating Divyesh with proper password...\n');

        // Delete existing Divyesh
        const deleted = await User.deleteOne({ email: 'divyesh@student.edu' });
        console.log(`✓ Deleted ${deleted.deletedCount} existing user(s)\n`);

        // Delete game results
        await GameResult.deleteMany({ userId: { $exists: false } });

        // Find Sarvesh teacher
        const teacher = await User.findOne({ email: 'sarvesh@school.edu' });

        if (!teacher) {
            console.log('❌ Sarvesh teacher not found!');
            process.exit(1);
        }

        console.log(`✓ Found teacher: ${teacher.name} (ID: ${teacher._id})\n`);

        // Create password hash
        console.log('🔐 Creating password hash...');
        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(`✓ Hash created: ${hashedPassword.substring(0, 30)}...\n`);

        // Verify hash works
        const testMatch = await bcrypt.compare(password, hashedPassword);
        console.log(`✓ Hash verification: ${testMatch ? 'PASSED' : 'FAILED'}\n`);

        if (!testMatch) {
            console.log('❌ Hash verification failed!');
            process.exit(1);
        }

        // Create Divyesh
        console.log('➕ Creating Divyesh...');
        const divyesh = await User.create({
            name: 'Divyesh',
            email: 'divyesh@student.edu',
            password: hashedPassword,
            role: 'student',
            status: 'active',
            selectedClass: 10,
            teacherId: teacher._id,
            learnerCategory: 'fast',
            xp: 3500,
            streak: 35,
        });

        console.log('✅ Divyesh created!');
        console.log(`   ID: ${divyesh._id}`);
        console.log(`   Email: ${divyesh.email}`);
        console.log(`   Status: ${divyesh.status}\n`);

        // Test login immediately
        console.log('🧪 Testing login...');
        const foundUser = await User.findOne({ email: 'divyesh@student.edu' });
        const loginTest = await bcrypt.compare('password123', foundUser.password);

        if (loginTest) {
            console.log('✅ Login test PASSED!\n');
        } else {
            console.log('❌ Login test FAILED!\n');
            process.exit(1);
        }

        console.log('🎉 Divyesh ready to login!');
        console.log('\n📝 Credentials:');
        console.log('   Email: divyesh@student.edu');
        console.log('   Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

recreateDivyesh();
