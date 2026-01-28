const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

async function createDivyesh() {
    try {
        console.log('🔍 Checking for Divyesh...\n');

        // Check if exists
        let divyesh = await User.findOne({ email: 'divyesh@student.edu' });

        if (divyesh) {
            console.log('✅ Divyesh already exists!');
            console.log(`   Name: ${divyesh.name}`);
            console.log(`   Email: ${divyesh.email}`);
            console.log(`   Class: ${divyesh.selectedClass}`);
            console.log(`   Teacher ID: ${divyesh.teacherId}`);
            process.exit(0);
        }

        console.log('➕ Creating Divyesh...\n');

        // Find Sarvesh teacher
        const sarvesh = await User.findOne({ email: 'sarvesh@school.edu' });

        if (!sarvesh) {
            console.log('❌ Sarvesh teacher not found! Creating...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            const newSarvesh = await User.create({
                name: 'Sarvesh',
                email: 'sarvesh@school.edu',
                password: hashedPassword,
                role: 'teacher',
                status: 'active',
                xp: 10000,
                streak: 50,
            });
            console.log(`✅ Created Sarvesh: ${newSarvesh._id}\n`);
        }

        const teacher = sarvesh || await User.findOne({ email: 'sarvesh@school.edu' });
        console.log(`✅ Found teacher: ${teacher.name} (ID: ${teacher._id})\n`);

        // Create Divyesh
        const hashedPassword = await bcrypt.hash('password123', 10);

        divyesh = new User({
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

        await divyesh.save();
        console.log('✅ Created Divyesh!');
        console.log(`   Name: ${divyesh.name}`);
        console.log(`   Email: ${divyesh.email}`);
        console.log(`   Password: password123`);
        console.log(`   Class: ${divyesh.selectedClass}`);
        console.log(`   Teacher: ${teacher.name}`);
        console.log(`   XP: ${divyesh.xp}`);
        console.log(`   Streak: ${divyesh.streak} days`);
        console.log(`   ID: ${divyesh._id}\n`);

        // Create game results
        console.log('🎮 Creating game results...');

        for (let i = 0; i < 5; i++) {
            const game = randomElement(games);
            const score = randomInt(80, 100);
            const timeTaken = randomInt(30, 100);

            const gameResult = new GameResult({
                userId: divyesh._id,
                gameType: game,
                score: score,
                maxScore: 100,
                xpEarned: Math.floor(score * 1.5),
                timeTaken: timeTaken,
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

            await gameResult.save();
            console.log(`   ✓ ${game}: ${score}%`);
        }

        console.log('\n🎉 Divyesh created successfully!');
        console.log('\n📝 Login with:');
        console.log('   Email: divyesh@student.edu');
        console.log('   Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createDivyesh();
