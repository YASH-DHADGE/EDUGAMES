const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');
const GameResult = require('./models/GameResult');

const subjects = ['Math', 'Science', 'English', 'Social'];
const games = ['cell_command', 'label_organ', 'chemistry_balance', 'cell_structure', 'force_play', 'digestive_dash'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[randomInt(0, arr.length - 1)];

async function createDivyeshCorrectly() {
    try {
        console.log('🔄 Creating Divyesh (with auto-hash)...\n');

        // Delete existing
        await User.deleteOne({ email: 'divyesh@student.edu' });
        console.log('✓ Cleared existing user\n');

        // Find Sarvesh
        const teacher = await User.findOne({ email: 'sarvesh@school.edu' });

        if (!teacher) {
            console.log('❌ Teacher not found!');
            process.exit(1);
        }

        console.log(`✓ Found teacher: ${teacher.name}\n`);

        // Create with PLAIN password - let the model hash it!
        console.log('➕ Creating Divyesh with plain password (model will hash)...');
        const divyesh = await User.create({
            name: 'Divyesh',
            email: 'divyesh@student.edu',
            password: 'password123', // PLAIN PASSWORD - model will hash it
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
        console.log(`   Email: ${divyesh.email}\n`);

        // Test login
        console.log('🧪 Testing login...');
        const testUser = await User.findOne({ email: 'divyesh@student.edu' });
        const isMatch = await testUser.matchPassword('password123');

        if (isMatch) {
            console.log('✅ Login test PASSED!\n');
        } else {
            console.log('❌ Login test FAILED!');
            console.log('Password hash:', testUser.password.substring(0, 30) + '...\n');
            process.exit(1);
        }

        // Create game results
        console.log('🎮 Creating 5 game results...');
        for (let i = 0; i < 5; i++) {
            const game = randomElement(games);
            const score = randomInt(85, 100);

            await GameResult.create({
                userId: divyesh._id,
                gameType: game,
                score: score,
                maxScore: 100,
                xpEarned: Math.floor(score * 1.5),
                timeTaken: randomInt(30, 100),
                difficulty: 'medium',
                subject: randomElement(subjects),
                classLevel: '10',
                delta: randomInt(15, 25),
                proficiency: score >= 90 ? 'Expert' : 'Advanced',
                accuracy: score,
                completedLevel: randomInt(3, 5),
                attempts: 1,
                mistakes: randomInt(0, 2),
            });

            console.log(`   ✓ ${game}: ${score}%`);
        }

        console.log('\n🎉 All done!');
        console.log('\n📝 Login Credentials:');
        console.log('   Email: divyesh@student.edu');
        console.log('   Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createDivyeshCorrectly();
