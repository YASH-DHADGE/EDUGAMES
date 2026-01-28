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

async function addDivyeshToSarvesh() {
    try {
        console.log('👨‍🎓 Adding Divyesh as student under Sarvesh...\n');

        // Find teacher "sarvesh" (case-insensitive)
        const teacher = await User.findOne({
            role: 'teacher',
            $or: [
                { name: /sarvesh/i },
                { email: /sarvesh/i }
            ]
        });

        if (!teacher) {
            console.log('❌ Teacher "sarvesh" not found!');
            console.log('Please make sure you have a teacher account with name or email containing "sarvesh"');
            process.exit(1);
        }

        console.log(`✅ Found teacher: ${teacher.name} (${teacher.email})\n`);

        // Check if Divyesh already exists
        let divyesh = await User.findOne({
            email: 'divyesh@student.edu'
        });

        const hashedPassword = await bcrypt.hash('password123', 10);
        const classNumber = 10; // Class 10
        const learnerCategory = 'fast'; // Make Divyesh a fast learner

        if (divyesh) {
            // Update existing Divyesh
            console.log('📝 Updating existing Divyesh...');
            divyesh.teacherId = teacher._id;
            divyesh.selectedClass = classNumber;
            divyesh.learnerCategory = learnerCategory;
            divyesh.status = 'active';
            await divyesh.save();
            console.log('✅ Updated Divyesh\'s teacher assignment');
        } else {
            // Create new Divyesh
            console.log('➕ Creating new student: Divyesh...');
            divyesh = await User.create({
                name: 'Divyesh',
                email: 'divyesh@student.edu',
                password: hashedPassword,
                role: 'student',
                status: 'active',
                selectedClass: classNumber,
                teacherId: teacher._id,
                learnerCategory: learnerCategory,
                xp: randomInt(2000, 5000), // High XP
                streak: randomInt(20, 50), // Good streak
            });
            console.log('✅ Created Divyesh!');
        }

        // Clear existing game results for Divyesh
        await GameResult.deleteMany({ userId: divyesh._id });

        // Create game results for Divyesh
        console.log('\n🎮 Creating game results...');
        const numGames = 5; // 5 games

        for (let j = 0; j < numGames; j++) {
            const game = randomElement(games);
            const score = randomInt(75, 100); // High scores (fast learner)
            const timeTaken = randomInt(30, 120); // Quick completion
            const difficulty = randomElement(['medium', 'hard']); // Harder difficulties

            // Calculate delta (high performance)
            let delta = randomInt(15, 25);

            // High proficiency
            let proficiency = score >= 90 ? 'Expert' : 'Advanced';

            await GameResult.create({
                userId: divyesh._id,
                gameType: game,
                score: score,
                maxScore: 100,
                xpEarned: Math.floor(score * 1.5),
                timeTaken: timeTaken,
                difficulty: difficulty,
                subject: randomElement(subjects),
                classLevel: String(classNumber),
                delta: delta,
                proficiency: proficiency,
                accuracy: score,
                completedLevel: randomInt(3, 5),
                attempts: 1, // First try success
                mistakes: randomInt(0, 2), // Very few mistakes
            });

            console.log(`   ✓ ${game}: ${score}% (${proficiency}) - Delta: +${delta}`);
        }

        console.log('\n📊 Divyesh Summary:');
        console.log(`   Name: Divyesh`);
        console.log(`   Email: divyesh@student.edu`);
        console.log(`   Password: password123`);
        console.log(`   Class: ${classNumber}`);
        console.log(`   Teacher: ${teacher.name}`);
        console.log(`   XP: ${divyesh.xp}`);
        console.log(`   Streak: ${divyesh.streak} days`);
        console.log(`   Category: ${learnerCategory} learner`);
        console.log(`   Game Results: ${numGames}`);

        console.log('\n🎉 Divyesh successfully added to Sarvesh\'s class!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addDivyeshToSarvesh();
