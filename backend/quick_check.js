const mongoose = require('mongoose');
const User = require('./models/User');
const GameResult = require('./models/GameResult');
const LearnerClassifier = require('./services/learnerClassifier');
const dotenv = require('dotenv');

dotenv.config();

async function quickCheck() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await new Promise(resolve => setTimeout(resolve, 3000));

        const students = await User.find({ role: 'student' }).limit(10);

        console.log(`\nChecking ${students.length} students...\n`);

        for (const student of students) {
            const games = await GameResult.find({ userId: student._id }).sort({ createdAt: -1 }).limit(1);

            if (games.length === 0) {
                console.log(`${student.name}: NO GAMES - ${student.learnerCategory || 'neutral'}`);
                continue;
            }

            const game = games[0];
            const scorePercent = ((game.score / (game.maxScore || 100)) * 100).toFixed(0);

            const gameData = {
                score: game.score,
                maxScore: game.maxScore || 100,
                accuracy: game.accuracy || 0,
                duration: game.duration || 0,
                difficulty: game.difficulty || 'medium',
                completedLevel: 1
            };

            const userStats = {
                xp: student.xp,
                level: student.level,
                streak: student.streak
            };

            const predicted = await LearnerClassifier.classify(gameData, userStats);
            const current = student.learnerCategory || 'neutral';
            const match = current === predicted ? '✓' : '✗';

            console.log(`${match} ${student.name}:`);
            console.log(`   Last Game: ${scorePercent}% (${game.gameType}), XP:${student.xp}`);
            console.log(`   DB: ${current.toUpperCase()} -> Predicted: ${predicted.toUpperCase()}\n`);
        }

        mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

quickCheck();
