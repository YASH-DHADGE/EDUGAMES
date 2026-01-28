const mongoose = require('mongoose');
const User = require('./models/User');
const GameResult = require('./models/GameResult');
require('dotenv').config();

const testAnalytics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const studentId = '69285f0b874d451cfbb37f6b';

        // Get latest game results for this student
        const gameResults = await GameResult.find({ userId: studentId }).sort({ createdAt: -1 }).limit(5);

        console.log('\n=== LATEST 5 GAME RESULTS ===');
        gameResults.forEach((result, index) => {
            console.log(`\n[${index + 1}] Game: ${result.gameType}`);
            console.log(`    Score: ${result.score}`);
            console.log(`    Difficulty: ${result.difficulty}`);
            console.log(`    Delta: ${result.delta}`);
            console.log(`    Proficiency: ${result.proficiency}`);
            console.log(`    Created: ${result.createdAt}`);
        });

        // Now simulate what the analytics endpoint does
        console.log('\n=== ANALYTICS ENDPOINT SIMULATION ===');
        const distinctGames = [...new Set(gameResults.map(r => r.gameType))];

        distinctGames.forEach(gameType => {
            const resultsForGame = gameResults.filter(r => r.gameType === gameType);
            const bestScore = Math.max(...resultsForGame.map(r => r.score));
            const latest = resultsForGame[0];

            console.log(`\nGame: ${gameType}`);
            console.log(`  Best Score: ${bestScore}`);
            console.log(`  Latest Proficiency: ${latest.proficiency || 'Not Rated'}`);
            console.log(`  Latest Delta: ${latest.delta !== undefined ? latest.delta : 'N/A'}`);
        });

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

testAnalytics();
