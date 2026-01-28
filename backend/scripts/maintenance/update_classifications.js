const mongoose = require('mongoose');
const User = require('./models/User');
const GameResult = require('./models/GameResult');
const LearnerClassifier = require('./services/learnerClassifier');
const dotenv = require('dotenv');

dotenv.config();

async function updateAllClassifications() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('Connected!\n');

        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students to reclassify\n`);

        let fixed = 0;
        let noGames = 0;
        let alreadyCorrect = 0;

        for (const student of students) {
            const games = await GameResult.find({ userId: student._id }).sort({ createdAt: -1 }).limit(1);

            if (games.length === 0) {
                console.log(`⏭️  ${student.name}: No games - keeping as neutral`);
                if (student.learnerCategory !== 'neutral') {
                    student.learnerCategory = 'neutral';
                    await student.save();
                    fixed++;
                }
                noGames++;
                continue;
            }

            const game = games[0];
            const gameData = {
                score: game.score || 0,
                maxScore: game.maxScore || 100,
                accuracy: game.accuracy || 0,
                duration: game.duration || game.timeTaken || 0,
                difficulty: game.difficulty || 'medium',
                completedLevel: game.completedLevel || 1
            };

            const userStats = {
                xp: student.xp || 0,
                level: student.level || 1,
                streak: student.streak || 0
            };

            const newClassification = await LearnerClassifier.classify(gameData, userStats);
            const oldClassification = student.learnerCategory || 'neutral';

            if (oldClassification !== newClassification) {
                console.log(`🔧 ${student.name}: ${oldClassification.toUpperCase()} → ${newClassification.toUpperCase()}`);
                student.learnerCategory = newClassification;
                await student.save();
                fixed++;
            } else {
                console.log(`✓  ${student.name}: ${newClassification.toUpperCase()} (already correct)`);
                alreadyCorrect++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('SUMMARY:');
        console.log(`  ✓ Already Correct: ${alreadyCorrect}`);
        console.log(`  🔧 Fixed: ${fixed}`);
        console.log(`  ⏭️  No Games: ${noGames}`);
        console.log(`  📊 Total: ${students.length}`);
        console.log('='.repeat(50));

        mongoose.disconnect();
        console.log('\n✅ All classifications updated!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateAllClassifications();
