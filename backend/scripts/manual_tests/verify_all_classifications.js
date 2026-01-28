const mongoose = require('mongoose');
const User = require('./models/User');
const GameResult = require('./models/GameResult');
const LearnerClassifier = require('./services/learnerClassifier');
const dotenv = require('dotenv');

dotenv.config();

async function verifyAllClassifications() {
    try {
        console.log("🔍 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected!\n");

        // Wait for classifier to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get all students
        const students = await User.find({ role: 'student' }).select('name email xp level streak learnerCategory');
        console.log(`📊 Found ${students.length} students\n`);
        console.log("=".repeat(80));

        for (const student of students) {
            console.log(`\n👤 STUDENT: ${student.name} (${student.email})`);
            console.log(`   Current Classification: ${(student.learnerCategory || 'neutral').toUpperCase()}`);
            console.log(`   Stats: XP=${student.xp}, Level=${student.level}, Streak=${student.streak}`);

            // Get their latest game results
            const gameResults = await GameResult.find({ userId: student._id })
                .sort({ createdAt: -1 })
                .limit(5);

            if (gameResults.length === 0) {
                console.log(`   ⚠️  No game results found - Cannot classify`);
                console.log("-".repeat(80));
                continue;
            }

            console.log(`\n   📝 Analyzing last ${gameResults.length} game(s):\n`);

            // Classify based on each game result
            const classifications = [];
            for (let i = 0; i < Math.min(3, gameResults.length); i++) {
                const game = gameResults[i];

                console.log(`   Game ${i + 1}: ${game.gameType || 'Unknown'}`);
                console.log(`      Score: ${game.score}/${game.maxScore || 100} (${((game.score / (game.maxScore || 100)) * 100).toFixed(1)}%)`);
                console.log(`      Accuracy: ${(game.accuracy * 100).toFixed(1)}%`);
                console.log(`      Difficulty: ${game.difficulty || 'medium'}`);
                console.log(`      Proficiency: ${game.proficiency || 'N/A'}`);
                console.log(`      Delta: ${game.delta || 'N/A'}\n`);

                const gameData = {
                    score: game.score,
                    maxScore: game.maxScore || 100,
                    accuracy: game.accuracy || 0,
                    duration: game.duration || game.timeTaken || 0,
                    difficulty: game.difficulty || 'medium',
                    completedLevel: game.completedLevel || 1
                };

                const userStats = {
                    xp: student.xp,
                    level: student.level,
                    streak: student.streak
                };

                const predicted = await LearnerClassifier.classify(gameData, userStats);
                classifications.push(predicted);
            }

            // Determine overall classification (most common)
            const classCount = {};
            classifications.forEach(c => {
                classCount[c] = (classCount[c] || 0) + 1;
            });

            const predicted = Object.keys(classCount).reduce((a, b) =>
                classCount[a] > classCount[b] ? a : b
            );

            console.log(`\n   📊 VERDICT:`);
            console.log(`      Current DB Status: ${(student.learnerCategory || 'neutral').toUpperCase()}`);
            console.log(`      Predicted Status: ${predicted.toUpperCase()}`);

            if (student.learnerCategory !== predicted) {
                console.log(`      ⚠️  MISMATCH DETECTED!`);
                console.log(`      💡 Recommendation: Update ${student.name} to ${predicted.toUpperCase()}`);
            } else {
                console.log(`      ✅ Classification is CORRECT!`);
            }

            console.log("-".repeat(80));
        }

        console.log("\n\n" + "=".repeat(80));
        console.log("📈 SUMMARY");
        console.log("=".repeat(80));

        const summary = await User.aggregate([
            { $match: { role: 'student' } },
            {
                $group: {
                    _id: '$learnerCategory',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log("\nCurrent Classifications in Database:");
        summary.forEach(s => {
            console.log(`   ${(s._id || 'neutral').toUpperCase()}: ${s.count} student(s)`);
        });

        console.log("\n✅ Verification Complete!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

verifyAllClassifications();
