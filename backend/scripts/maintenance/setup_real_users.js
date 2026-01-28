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

async function setupRealUsers() {
    try {
        console.log('🔍 Checking for existing users...\n');

        // Check for Sarvesh
        let sarvesh = await User.findOne({ email: 'sarvesh@gmail.com' });

        if (sarvesh) {
            console.log('✅ Found Sarvesh (teacher):');
            console.log(`   Email: ${sarvesh.email}`);
            console.log(`   Name: ${sarvesh.name}`);
            console.log(`   Role: ${sarvesh.role}`);
            console.log(`   Status: ${sarvesh.status}\n`);
        } else {
            console.log('➕ Creating Sarvesh (teacher)...');
            sarvesh = await User.create({
                name: 'Sarvesh',
                email: 'sarvesh@gmail.com',
                password: 'password123', // Plain password - model will hash
                role: 'teacher',
                status: 'active',
                xp: 10000,
                streak: 50,
            });
            console.log('✅ Created Sarvesh!');
            console.log(`   Email: ${sarvesh.email}`);
            console.log(`   Password: password123\n`);
        }

        // Test Sarvesh login
        const sarveshTest = await User.findOne({ email: 'sarvesh@gmail.com' });
        const sarveshMatch = await sarveshTest.matchPassword('password123');
        console.log(`🧪 Sarvesh login test: ${sarveshMatch ? '✅ PASSED' : '❌ FAILED'}\n`);

        // Check for Divyesh
        let divyesh = await User.findOne({ email: 'divyeshravane21543@gmail.com' });

        if (divyesh) {
            console.log('✅ Found Divyesh (student):');
            console.log(`   Email: ${divyesh.email}`);
            console.log(`   Name: ${divyesh.name}`);
            console.log(`   Role: ${divyesh.role}`);
            console.log(`   Status: ${divyesh.status}`);
            console.log(`   Teacher ID: ${divyesh.teacherId}\n`);

            // Update teacher assignment if needed
            if (!divyesh.teacherId || divyesh.teacherId.toString() !== sarvesh._id.toString()) {
                console.log('🔄 Updating Divyesh teacher assignment...');
                divyesh.teacherId = sarvesh._id;
                divyesh.status = 'active';
                await divyesh.save();
                console.log('✅ Updated!\n');
            }
        } else {
            console.log('➕ Creating Divyesh (student)...');
            divyesh = await User.create({
                name: 'Divyesh Ravane',
                email: 'divyeshravane21543@gmail.com',
                password: 'password123', // Plain password - model will hash
                role: 'student',
                status: 'active',
                selectedClass: 10,
                teacherId: sarvesh._id,
                learnerCategory: 'fast',
                xp: 3500,
                streak: 35,
            });
            console.log('✅ Created Divyesh!');
            console.log(`   Email: ${divyesh.email}`);
            console.log(`   Password: password123`);
            console.log(`   Assigned to: ${sarvesh.name}\n`);

            // Create game results
            console.log('🎮 Creating game results for Divyesh...');
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
            console.log('');
        }

        // Test Divyesh login
        const divyeshTest = await User.findOne({ email: 'divyeshravane21543@gmail.com' });
        const divyeshMatch = await divyeshTest.matchPassword('password123');
        console.log(`🧪 Divyesh login test: ${divyeshMatch ? '✅ PASSED' : '❌ FAILED'}\n`);

        // Summary
        console.log('📊 Summary:');
        console.log('\n👨‍🏫 Teacher Account:');
        console.log('   Email: sarvesh@gmail.com');
        console.log('   Password: password123');
        console.log('   Role: Teacher');

        console.log('\n👨‍🎓 Student Account:');
        console.log('   Email: divyeshravane21543@gmail.com');
        console.log('   Password: password123');
        console.log('   Role: Student');
        console.log('   Class: 10');
        console.log('   Teacher: Sarvesh');

        console.log('\n🎉 All ready to login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupRealUsers();
