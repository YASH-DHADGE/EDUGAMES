const User = require('../models/User');

// @desc    Add XP to user
// @route   POST /api/xp/add
// @access  Private
const addXP = async (req, res) => {
    try {
        const { amount, source } = req.body;
        const userId = req.user._id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid XP amount' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add XP
        user.xp += amount;

        // Calculate level (150 XP per level)
        user.level = Math.floor(user.xp / 150) + 1;
        user.lastXpUpdate = new Date();

        await user.save();

        res.json({
            xp: user.xp,
            level: user.level,
            message: `Added ${amount} XP from ${source || 'activity'}`
        });
    } catch (error) {
        console.error('Add XP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Sync XP from client
// @route   PUT /api/xp/sync
// @access  Private
const syncXP = async (req, res) => {
    try {
        const { xp, level } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only update if client XP is higher (offline progress)
        if (xp > user.xp) {
            user.xp = xp;
            user.level = level || Math.floor(xp / 150) + 1;
            user.lastXpUpdate = new Date();
            await user.save();
        }

        res.json({
            xp: user.xp,
            level: user.level,
            synced: true
        });
    } catch (error) {
        console.error('Sync XP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user XP status
// @route   GET /api/xp/status
// @access  Private
const getXPStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('xp level lastXpUpdate');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const xpInLevel = user.xp % 150;
        const xpForNextLevel = 150;

        res.json({
            xp: user.xp,
            level: user.level,
            xpInLevel,
            xpForNextLevel,
            lastUpdate: user.lastXpUpdate
        });
    } catch (error) {
        console.error('Get XP status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get leaderboard
// @route   GET /api/xp/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
    try {
        console.log('Fetching leaderboard...');
        const leaderboard = await User.find({ role: 'student' })
            .sort({ xp: -1 })
            .select('name xp level avatar selectedClass streak');

        console.log(`Found ${leaderboard.length} students for leaderboard`);
        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addXP,
    syncXP,
    getXPStatus,
    getLeaderboard
};
