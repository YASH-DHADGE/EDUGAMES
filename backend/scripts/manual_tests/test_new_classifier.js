const LearnerClassifier = require('./services/learnerClassifier');

async function testNewClassifier() {
    console.log("=== Testing New Rule-Based Classifier ===\n");

    // Wait for models to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test Case 1: High Performer (should be FAST)
    const fastData = {
        score: 50,
        maxScore: 50,
        accuracy: 1.0,
        duration: 120,
        difficulty: 'hard',
        completedLevel: 1
    };
    const fastUser = { xp: 1419, level: 5, streak: 3 };

    console.log("TEST 1: High Performer (Divyesh scenario)");
    console.log("Input:", fastData);
    console.log("User Stats:", fastUser);
    const result1 = await LearnerClassifier.classify(fastData, fastUser);
    console.log(`\n=> Final Classification: ${result1.toUpperCase()}\n`);
    console.log("=".repeat(60) + "\n");

    // Test Case 2: Average Performer (should be NEUTRAL)
    const neutralData = {
        score: 65,
        maxScore: 100,
        accuracy: 0.65,
        duration: 300,
        difficulty: 'medium',
        completedLevel: 1
    };
    const neutralUser = { xp: 350, level: 2, streak: 1 };

    console.log("TEST 2: Average Performer");
    console.log("Input:", neutralData);
    console.log("User Stats:", neutralUser);
    const result2 = await LearnerClassifier.classify(neutralData, neutralUser);
    console.log(`\n=> Final Classification: ${result2.toUpperCase()}\n`);
    console.log("=".repeat(60) + "\n");

    // Test Case 3: Struggling Learner (should be SLOW)
    const slowData = {
        score: 30,
        maxScore: 100,
        accuracy: 0.3,
        duration: 900,
        difficulty: 'easy',
        completedLevel: 1
    };
    const slowUser = { xp: 50, level: 1, streak: 0 };

    console.log("TEST 3: Struggling Learner");
    console.log("Input:", slowData);
    console.log("User Stats:", slowUser);
    const result3 = await LearnerClassifier.classify(slowData, slowUser);
    console.log(`\n=> Final Classification: ${result3.toUpperCase()}\n`);
    console.log("=".repeat(60));

    console.log("\n✅ All tests complete!");
    process.exit(0);
}

testNewClassifier().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
