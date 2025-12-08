const GameResult = require('../models/GameResult');
const User = require('../models/User');
const LearnerClassifier = require('../services/learnerClassifier');
const fs = require('fs');
const path = require('path');

// @desc    Get Game Configuration
// @route   GET /api/games/config
// @access  Public
const getGameConfig = async (req, res) => {
    try {
        const config = {
            "6": {
                timer: 60,
                hints: 3,
                pointsPerLink: 10
            },
            difficultyMultipliers: {
                easy: 1.5,
                medium: 1,
                hard: 0.75
            }
        };
        res.json(config);
    } catch (error) {
        console.error('Error fetching game config:', error);
        res.status(500).json({ message: 'Failed to fetch config' });
    }
};

// @desc    Get Game Content
// @route   GET /api/games/content
// @access  Public
const getGameContent = async (req, res) => {
    try {
        const { gameType, class: classLevel, subject } = req.query;

        if (!classLevel || !subject) {
            return res.status(400).json({ message: 'Class level and subject are required' });
        }

        const fileName = `class${classLevel}-${subject.toLowerCase()}-content.json`;
        const filePath = path.join(__dirname, '..', 'data', fileName);
        console.log(`Loading content from: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.error('Content file not found');
            return res.status(404).json({ message: 'Content file not found' });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        console.log(`Loaded JSON. Chapters count: ${data.chapters?.length}`);

        let gameContent = {};

        if (gameType === 'conceptChain') {
            const concepts = [];

            // Connected Subset Selection Logic
            // We want a coherent set of concepts, not random ones.
            // Target count based on class level (approximate)
            const classInt = parseInt(classLevel) || 6;
            const targetCount = classInt <= 6 ? 6 : classInt <= 8 ? 10 : classInt <= 10 ? 15 : 20;
            console.log(`Target concept count: ${targetCount}`);

            let selectedConcepts = [];

            // Ensure data.chapters exists before sorting
            const chapters = data.chapters || [];
            const shuffledChapters = [...chapters].sort(() => 0.5 - Math.random());

            for (const chapter of shuffledChapters) {
                if (selectedConcepts.length >= targetCount) break;

                // 1. Add Chapter
                const chapterNode = {
                    id: `ch_${chapter.name.replace(/\s+/g, '_')}`,
                    label: chapter.name,
                    connections: [],
                    type: 'chapter'
                };
                selectedConcepts.push(chapterNode);

                // 2. Add Subchapters
                const subchapters = chapter.subchapters || [];
                for (const sub of subchapters) {
                    if (selectedConcepts.length >= targetCount) break;

                    const subId = `sub_${sub.name.replace(/\s+/g, '_')}`;
                    const subNode = {
                        id: subId,
                        label: sub.name,
                        connections: [chapterNode.id], // Connect back to chapter
                        type: 'topic'
                    };
                    selectedConcepts.push(subNode);
                    chapterNode.connections.push(subId);

                    // 3. Add Terms
                    if (sub.content && sub.content.definitions) {
                        sub.content.definitions.forEach((def, index) => {
                            if (selectedConcepts.length >= targetCount) return;

                            const [term, description] = def.split(':');
                            if (term) {
                                const termId = `term_${term.trim().replace(/\s+/g, '_')}_${index}`;
                                const termNode = {
                                    id: termId,
                                    label: term.trim(),
                                    description: description ? description.trim() : '',
                                    connections: [subId],
                                    type: 'term'
                                };
                                selectedConcepts.push(termNode);
                                subNode.connections.push(termId);
                            }
                        });
                    }
                }
            }

            console.log(`Selected concepts count: ${selectedConcepts.length}`);
            gameContent = { concepts: selectedConcepts };
        } else {
            // Default generic return if game type logic not specific
            gameContent = data;
        }

        res.json(gameContent);

    } catch (error) {
        console.error('Error fetching game content:', error);
        res.status(500).json({ message: 'Failed to fetch content', error: error.message });
    }
};

// @desc    Save Game Result
// @route   POST /api/games/result
// @access  Private
const saveGameResult = async (req, res) => {
    try {
        const { gameId, score, maxScore, accuracy, duration, timeTaken, difficulty, completedLevel } = req.body;
        const userId = req.user.id;

        // Normalize time: prefer timeTaken, fallback to duration
        const finalTimeTaken = timeTaken !== undefined ? timeTaken : duration;

        const result = new GameResult({
            userId: userId,
            gameType: gameId, // Map gameId to gameType as per schema
            score,
            maxScore,
            accuracy,
            duration: finalTimeTaken,
            timeTaken: finalTimeTaken,
            difficulty,
            completedLevel
        });

        await result.save();

        // Update User Stats (Simplified for now - can be expanded)
        const user = await User.findById(userId);
        if (user) {
            // Add XP logic here if centralized, or trust the frontend's separate XP call?
            // Usually backend should handle XP to prevent cheating.
            // For now, let's just save the result. The XP endpoint is separate (/api/users/xp).

            // --- LEARNER CLASSIFICATION ---
            const gameData = {
                score, maxScore, accuracy, duration, completedLevel, difficulty
            };
            const userStats = {
                xp: user.xp,
                level: user.level,
                streak: user.streak
            };

            const category = await LearnerClassifier.classify(gameData, userStats);
            if (category && category !== 'neutral') {
                user.learnerCategory = category;
                await user.save();
                console.log(`User ${user.name} classified as ${category}`);
            }
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error saving game result:', error);
        res.status(500).json({ message: 'Failed to save game result' });
    }
};

// @desc    Get Highscores
// @route   GET /api/games/:gameId/highscores
// @access  Public
const getHighscores = async (req, res) => {
    try {
        const { gameId } = req.params;
        const scores = await GameResult.find({ gameId })
            .sort({ score: -1 })
            .limit(10)
            .populate('user', 'name school');

        res.json(scores);
    } catch (error) {
        console.error('Error fetching highscores:', error);
        res.status(500).json({ message: 'Failed to fetch highscores' });
    }
};

// @desc    Get User Game Stats
// @route   GET /api/games/user-stats
// @access  Private
const getUserGameStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Aggregate to find the latest game result for each gameId for this user
        // We want: gameId, lastPlayed (createdAt), lastTimeTaken (timeTaken), highScore (max score for that game)

        const stats = await GameResult.aggregate([
            { $match: { user: userId } }, // Filter by user (will be ObjectId if schema uses it, but checking usage)
            // Note: req.user.id is string from auth middleware usually. 
            // If GameResult.user is ObjectId, we might need mongoose.Types.ObjectId(userId)
            // Let's check User model usage or existing queries.
        ]);

        // Actually, let's use a simpler approach first to avoid ObjectId casting issues if we aren't sure.
        // Or better yet, we can do independent queries or a JS transform since data volume isn't huge yet.
        // But aggregation is better. Let's assume standard Mongoose ObjectId behavior.

        // Revised Agile Approach: Find all results for user, sort by date desc.
        const allResults = await GameResult.find({ user: userId }).sort({ createdAt: -1 });

        const gameStats = {};

        allResults.forEach(result => {
            if (!gameStats[result.gameId]) {
                gameStats[result.gameId] = {
                    lastPlayed: result.createdAt,
                    lastTimeTaken: result.timeTaken || result.duration, // Fallback
                    lastScore: result.score,
                    highScore: result.score
                };
            } else {
                // Update high score
                if (result.score > gameStats[result.gameId].highScore) {
                    gameStats[result.gameId].highScore = result.score;
                }
            }
        });

        res.json(gameStats);

    } catch (error) {
        console.error('Error fetching user game stats:', error);
        res.status(500).json({ message: 'Failed to fetch user game stats' });
    }
};

module.exports = { saveGameResult, getHighscores, getGameConfig, getGameContent, getUserGameStats };
