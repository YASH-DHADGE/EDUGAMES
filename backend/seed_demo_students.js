const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const GameResult = require('./models/GameResult');
const LearnerClassifier = require('./services/learnerClassifier');
const dotenv = require('dotenv');

dotenv.config();

const STUDENT_NAMES = [
    'Aarav Sharma', 'Aisha Patel', 'Arjun Kumar', 'Diya Singh', 'Kabir Verma',
    'Ananya Gupta', 'Rohan Reddy', 'Saanvi Desai', 'Vihaan Mehta', 'Isha Iyer',
    'Reyansh Joshi', 'Aanya Nair', 'Advait Rao', 'Navya Shah', 'Ayaan Khan',
    'Mira Malhotra', 'Dhruv Agarwal', 'Kiara Menon', 'Atharv Chopra', 'Siya Kapoor',
    'Vivaan Saxena', 'Riya Bose', 'Aditya Pandey', 'Anvi Kulkarni', 'Krishiv Pillai',
    'Myra Choudhury', 'Shaurya Das', 'Shanaya Bhatt', 'Arnav Sinha', 'Tara Sethi'
];

const GAME_TYPES = ['chemistry_balance', 'cell_command', 'label_organ', 'cell_structure_quiz'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function createDemoStudents() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        // Wait for classifier
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get teacher ID
        const teacher = await User.findOne({ role: 'teacher' });
        if (!teacher) {
            console.log('❌ No teacher found. Please create a teacher first.');
            process.exit(1);
        }

        console.log(`📚 Creating 30 demo students for teacher: ${teacher.name}\n`);

        // Clear existing demo students (optional)
        const existingDemoCount = await User.countDocuments({
            role: 'student',
            email: { $regex: /^demo\.student/ }
        });

        if (existingDemoCount > 0) {
            console.log(`⚠️  Found ${existingDemoCount} existing demo students`);
            console.log('🗑️  Removing old demo data...');

            const demoStudents = await User.find({
                role: 'student',
                email: { $regex: /^demo\.student/ }
            });

            for (const student of demoStudents) {
                await GameResult.deleteMany({ userId: student._id });
            }

            await User.deleteMany({
                role: 'student',
                email: { $regex: /^demo\.student/ }
            });

            console.log('✅ Cleaned up old demo data\n');
        }

        let fastCount = 0;
        let neutralCount = 0;
        let slowCount = 0;

        // Create 30 students with varied performance
        for (let i = 0; i < 30; i++) {
            const studentName = STUDENT_NAMES[i];
            const email = `demo.student${i + 1}@example.com`;

            // Determine performance tier (realistic distribution)
            // 30% Fast, 50% Neutral, 20% Slow
            let performanceTier;
            const rand = Math.random();
            if (rand < 0.2) {
                performanceTier = 'slow';
            } else if (rand < 0.7) {
                performanceTier = 'neutral';
            } else {
                performanceTier = 'fast';
            }

            // Generate stats based on tier
            let xp, level, streak;

            if (performanceTier === 'fast') {
                xp = getRandomInt(800, 2500);
                level = getRandomInt(5, 15);
                streak = getRandomInt(3, 14);
                fastCount++;
            } else if (performanceTier === 'neutral') {
                xp = getRandomInt(200, 800);
                level = getRandomInt(2, 5);
                streak = getRandomInt(0, 5);
                neutralCount++;
            } else {
                xp = getRandomInt(0, 300);
                level = getRandomInt(1, 3);
                streak = getRandomInt(0, 2);
                slowCount++;
            }

            // Create student
            const student = await User.create({
                name: studentName,
                email: email,
                password: 'demo123', // Will be hashed by pre-save hook
                role: 'student',
                selectedClass: 6,
                teacherId: teacher._id,
                status: 'active',
                xp: xp,
                level: level,
                streak: streak,
                learnerCategory: 'neutral' // Will be updated after games
            });

            console.log(`👤 Created: ${studentName} (${performanceTier.toUpperCase()}) - XP: ${xp}, Level: ${level}`);

            // Create 3-7 game results per student
            const gameCount = getRandomInt(3, 7);

            for (let j = 0; j < gameCount; j++) {
                const gameType = getRandomElement(GAME_TYPES);
                const difficulty = getRandomElement(DIFFICULTIES);

                let score, maxScore, accuracy;

                // Generate scores based on performance tier
                if (performanceTier === 'fast') {
                    maxScore = 100;
                    score = getRandomInt(75, 100);
                    accuracy = getRandomInt(75, 100) / 100;
                } else if (performanceTier === 'neutral') {
                    maxScore = 100;
                    score = getRandomInt(50, 75);
                    accuracy = getRandomInt(50, 75) / 100;
                } else {
                    maxScore = 100;
                    score = getRandomInt(20, 50);
                    accuracy = getRandomInt(20, 50) / 100;
                }

                const duration = getRandomInt(60, 600);

                // Calculate proficiency
                let proficiency = 'Not Rated';
                const scorePercent = (score / maxScore) * 100;
                if (scorePercent >= 85) proficiency = 'Advanced';
                else if (scorePercent >= 70) proficiency = 'Proficient';
                else if (scorePercent >= 50) proficiency = 'Developing';

                await GameResult.create({
                    userId: student._id,
                    gameType: gameType,
                    score: score,
                    maxScore: maxScore,
                    accuracy: accuracy,
                    duration: duration,
                    timeTaken: duration,
                    difficulty: difficulty,
                    completedLevel: 1,
                    proficiency: proficiency,
                    delta: scorePercent,
                    createdAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000) // Random date in last 30 days
                });
            }

            // Classify student based on their game results
            const latestGame = await GameResult.findOne({ userId: student._id }).sort({ createdAt: -1 });

            if (latestGame) {
                const gameData = {
                    score: latestGame.score,
                    maxScore: latestGame.maxScore,
                    accuracy: latestGame.accuracy,
                    duration: latestGame.duration,
                    difficulty: latestGame.difficulty,
                    completedLevel: 1
                };

                const userStats = {
                    xp: student.xp,
                    level: student.level,
                    streak: student.streak
                };

                const classification = await LearnerClassifier.classify(gameData, userStats);
                student.learnerCategory = classification;
                await student.save();

                console.log(`   ✓ Classification: ${classification.toUpperCase()}\n`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 DEMO DATA SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Students Created: 30`);
        console.log(`  🟢 Fast Learners: ~${fastCount}`);
        console.log(`  ⚪ Neutral: ~${neutralCount}`);
        console.log(`  🟠 Slow Learners: ~${slowCount}`);
        console.log('='.repeat(60));

        // Verify final classifications
        const actualFast = await User.countDocuments({ role: 'student', learnerCategory: 'fast', email: { $regex: /^demo\.student/ } });
        const actualNeutral = await User.countDocuments({ role: 'student', learnerCategory: 'neutral', email: { $regex: /^demo\.student/ } });
        const actualSlow = await User.countDocuments({ role: 'student', learnerCategory: 'slow', email: { $regex: /^demo\.student/ } });

        console.log('\n📈 ACTUAL CLASSIFICATIONS:');
        console.log(`  🟢 Fast: ${actualFast}`);
        console.log(`  ⚪ Neutral: ${actualNeutral}`);
        console.log(`  🟠 Slow: ${actualSlow}`);
        console.log('='.repeat(60));

        console.log('\n✅ Demo data created successfully!');
        console.log('🔑 Login credentials for all demo students:');
        console.log('   Email: demo.student[1-30]@example.com');
        console.log('   Password: demo123\n');

        mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
}

createDemoStudents();
