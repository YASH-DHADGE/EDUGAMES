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
        try {
            // Extract and normalize metrics
            const score = Number(gameData.score) || 0;
            const maxScore = Number(gameData.maxScore) || 100;
            const accuracy = Number(gameData.accuracy) || 0;
            const duration = Number(gameData.duration) || 0;
            const level = Number(gameData.completedLevel) || 1;
            const diff = (gameData.difficulty || 'medium').toLowerCase();

            const xp = Number(userStats.xp) || 0;
            const uLevel = Number(userStats.level) || 1;
            const streak = Number(userStats.streak) || 0;

            // Calculate score percentage
            const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

            console.log(`[Classifier] Analyzing: Score=${score}/${maxScore} (${scorePercentage.toFixed(1)}%), Acc=${accuracy}, Dur=${duration}, Diff=${diff}, XP=${xp}, Level=${uLevel}, Streak=${streak}`);

            // Rule-based classification system
            let performanceScore = 0;
            let indicators = [];

            // 1. Score Performance (0-40 points)
            if (scorePercentage >= 85) {
                performanceScore += 40;
                indicators.push('Excellent score');
            } else if (scorePercentage >= 70) {
                performanceScore += 30;
                indicators.push('Good score');
            } else if (scorePercentage >= 50) {
                performanceScore += 15;
                indicators.push('Average score');
            } else {
                performanceScore += 0;
                indicators.push('Low score');
            }

            // 2. Accuracy Performance (0-30 points)
            const accuracyPercent = accuracy * 100; // Accuracy is 0-1
            if (accuracyPercent >= 85) {
                performanceScore += 30;
                indicators.push('High accuracy');
            } else if (accuracyPercent >= 70) {
                performanceScore += 20;
                indicators.push('Good accuracy');
            } else if (accuracyPercent >= 50) {
                performanceScore += 10;
                indicators.push('Average accuracy');
            } else {
                performanceScore += 0;
                indicators.push('Low accuracy');
            }

            // 3. Difficulty Bonus (0-15 points)
            if (diff === 'hard' && scorePercentage >= 60) {
                performanceScore += 15;
                indicators.push('Excels at hard difficulty');
            } else if (diff === 'medium' && scorePercentage >= 70) {
                performanceScore += 10;
                indicators.push('Good at medium difficulty');
            } else if (diff === 'easy' && scorePercentage >= 80) {
                performanceScore += 5;
                indicators.push('Competent at easy difficulty');
            }

            // 4. Overall Progress (0-15 points)
            if (xp >= 1000 && uLevel >= 5) {
                performanceScore += 15;
                indicators.push('Strong overall progress');
            } else if (xp >= 500 && uLevel >= 3) {
                performanceScore += 10;
                indicators.push('Good progress');
            } else if (xp >= 100) {
                performanceScore += 5;
                indicators.push('Some progress');
            }

            // 5. Consistency Bonus (Streak)
            if (streak >= 7) {
                performanceScore += 10;
                indicators.push('Excellent consistency');
            } else if (streak >= 3) {
                performanceScore += 5;
                indicators.push('Good consistency');
            }

            // Classification thresholds
            // Total possible: 40 + 30 + 15 + 15 + 10 = 110 points
            let classification = 'neutral';

            if (performanceScore >= 70) {
                classification = 'fast';
            } else if (performanceScore <= 35) {
                classification = 'slow';
            } else {
                classification = 'neutral';
            }

            console.log(`[Classifier] Performance Score: ${performanceScore}/110 -> ${classification.toUpperCase()}`);
            console.log(`[Classifier] Indicators: ${indicators.join(', ')}`);

            // Optional: Try ONNX model if available (for future enhancement)
            if (this.isReady) {
                try {
                    const diffEasy = diff === 'easy' ? 1 : 0;
                    const diffMedium = diff === 'medium' ? 1 : 0;
                    const diffHard = diff === 'hard' ? 1 : 0;

                    const inputData = Float32Array.from([
                        score, maxScore, accuracy, duration, level,
                        diffEasy, diffMedium, diffHard,
                        xp, uLevel, streak
                    ]);

                    const scalerInput = new ort.Tensor('float32', inputData, [1, 11]);
                    const scalerFeeds = { float_input: scalerInput };
                    const scalerResults = await this.scalerSession.run(scalerFeeds);

                    const scalerOutputName = this.scalerSession.outputNames[0];
                    const scaledData = scalerResults[scalerOutputName];

                    const classifierFeeds = { float_input: scaledData };
                    const classifierResults = await this.classifierSession.run(classifierFeeds);

                    const labelOutputName = this.classifierSession.outputNames[0];
                    const onnxResult = classifierResults[labelOutputName].data[0];

                    console.log(`[Classifier] ONNX Model result: ${onnxResult} (using rule-based: ${classification})`);
                    // Note: Using rule-based result as ONNX models need proper training
                } catch (onnxError) {
                    console.log('[Classifier] ONNX model error (using rule-based result):', onnxError.message);
                }
            }

            return classification;

        } catch (error) {
            console.error('[Classifier] Error:', error);
            // Safe fallback
            return 'neutral';
        }
    }
}

module.exports = new LearnerClassifier();
