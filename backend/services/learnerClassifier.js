const ort = require('onnxruntime-node');
const path = require('path');

class LearnerClassifier {
    constructor() {
        this.scalerSession = null;
        this.classifierSession = null;
        this.isReady = false;
        this.init();
    }

    async init() {
        try {
            const scalerPath = path.join(__dirname, '..', 'scaler.onnx');
            const classifierPath = path.join(__dirname, '..', 'learner_classifier_model.onnx');

            console.log('Loading ONNX models...');
            this.scalerSession = await ort.InferenceSession.create(scalerPath);
            this.classifierSession = await ort.InferenceSession.create(classifierPath);

            this.isReady = true;
            console.log('Learner Classification Models Loaded Successfully');
        } catch (error) {
            console.error('Failed to load ONNX models:', error);
        }
    }

    async classify(gameData, userStats) {
        if (!this.isReady) {
            console.warn('Classifier not ready, returning default');
            return 'neutral';
        }

        try {
            // Extract features
            // Assumption: 11 features
            // 1. Score
            // 2. Max Score
            // 3. Accuracy
            // 4. Duration
            // 5. Completed Level (default 1)
            // 6. Difficulty Easy (1/0)
            // 7. Difficulty Medium (1/0)
            // 8. Difficulty Hard (1/0)
            // 9. User XP
            // 10. User Level
            // 11. User Streak

            const score = Number(gameData.score) || 0;
            const maxScore = Number(gameData.maxScore) || 100;
            const accuracy = Number(gameData.accuracy) || 0;
            const duration = Number(gameData.duration) || 0;
            const level = Number(gameData.completedLevel) || 1;

            const diff = (gameData.difficulty || 'medium').toLowerCase();
            const diffEasy = diff === 'easy' ? 1 : 0;
            const diffMedium = diff === 'medium' ? 1 : 0;
            const diffHard = diff === 'hard' ? 1 : 0;

            const xp = Number(userStats.xp) || 0;
            const uLevel = Number(userStats.level) || 1;
            const streak = Number(userStats.streak) || 0;

            const inputData = Float32Array.from([
                score, maxScore, accuracy, duration, level,
                diffEasy, diffMedium, diffHard,
                xp, uLevel, streak
            ]);

            // 1. Run Scaler
            // Input name 'float_input' found via inspection
            const scalerInput = new ort.Tensor('float32', inputData, [1, 11]);
            const scalerFeeds = { float_input: scalerInput };
            const scalerResults = await this.scalerSession.run(scalerFeeds);

            // Output name 'variable'? Or usually variable_out?
            // Inspection said: Output Names: [ 'variable' ] (wait, let's verify output name dynamically)
            const scalerOutputName = this.scalerSession.outputNames[0];
            const scaledData = scalerResults[scalerOutputName];

            // 2. Run Classifier
            const classifierFeeds = { float_input: scaledData };
            const classifierResults = await this.classifierSession.run(classifierFeeds);

            const labelOutputName = this.classifierSession.outputNames[0];
            const resultLabel = classifierResults[labelOutputName].data[0];

            console.log(`Prediction: ${resultLabel} (Inputs: Score=${score}, Acc=${accuracy})`);

            // Interpret result
            // Handle BigInt or String numbers
            const label = Number(resultLabel);

            if (label === 0) return 'slow';
            if (label === 1) return 'fast';

            // If label is string 'slow'/'fast'
            if (typeof resultLabel === 'string') {
                return resultLabel;
            }

            return 'neutral';

        } catch (error) {
            console.error('Classification Error:', error);
            // Fallback
            return 'neutral';
        }
    }
}

module.exports = new LearnerClassifier();
