const mongoose = require('mongoose');
const LearnerClassifier = require('./services/learnerClassifier');
const dotenv = require('dotenv');

dotenv.config();

async function runVerification() {
    try {
        console.log("--- Starting Verification ---");

        // Wait for models to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test Case 1: Poor performance (expect 'slow' or neutral)
        const slowData = {
            score: 10,
            maxScore: 100,
            accuracy: 0.1,
            duration: 900, // 15 mins?
            difficulty: 'easy',
            completedLevel: 1
        };
        const slowUser = { xp: 0, level: 1, streak: 0 };

        console.log("Testing Slow Inputs:", slowData);
        const result1 = await LearnerClassifier.classify(slowData, slowUser);
        console.log("Result 1:", result1);

        // Test Case 2: Good performance (expect 'fast' or neutral)
        const fastData = {
            score: 95,
            maxScore: 100,
            accuracy: 0.95,
            duration: 60, // 1 min
            difficulty: 'hard',
            completedLevel: 5
        };
        const fastUser = { xp: 1000, level: 10, streak: 50 };

        console.log("Testing Fast Inputs:", fastData);
        const result2 = await LearnerClassifier.classify(fastData, fastUser);
        console.log("Result 2:", result2);

        console.log("--- Verification Complete ---");
        process.exit(0);
    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    }
}

runVerification();
