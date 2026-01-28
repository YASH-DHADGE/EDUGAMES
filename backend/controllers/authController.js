const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, language, role } = req.body;

        console.log('📝 Registration attempt:', { email, name, language, role });

        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log('⚠️ User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Determine status based on role
        let status = 'active';
        if (role === 'teacher' || role === 'institute') {
            status = 'pending';
        }

        const user = await User.create({
            name,
            email,
            password,
            language,
            role: role || 'student',
            status
        });

        if (user) {
            console.log('✅ User registered successfully:', { id: user._id, email: user.email, role: user.role, status: user.status });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token: generateToken(user._id),
                refreshToken: generateRefreshToken(user._id),
                message: status === 'pending' ? 'Registration successful. Please wait for approval.' : 'Registration successful'
            });
        } else {
            console.log('❌ Failed to create user - invalid data');
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('❌ Error in registerUser:', error);
        res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt for:', email);

        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log('User found, checking password...');
        const isPasswordMatch = await user.matchPassword(password);
        console.log('Password match result:', isPasswordMatch);

        if (user && isPasswordMatch) {
            console.log('Login successful for:', email);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                selectedClass: user.selectedClass,
                avatar: user.avatar,
                themeColor: user.themeColor,
                xp: user.xp,
                level: user.level,
                streak: user.streak,
                token: generateToken(user._id),
                refreshToken: generateRefreshToken(user._id)
            });
        } else {
            console.log('Password mismatch for:', email);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const token = generateToken(decoded.id);
        res.json({ token });
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    // In a real app with Redis, you would blacklist the token here
    res.json({ message: 'Logged out successfully' });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, email, selectedClass, avatar, themeColor, city } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = name || user.name;
            user.email = email || user.email;
            if (selectedClass !== undefined) {
                user.selectedClass = selectedClass;
            }
            if (avatar !== undefined) {
                user.avatar = avatar;
            }
            if (themeColor !== undefined) {
                user.themeColor = themeColor;
            }
            if (city !== undefined) {
                user.city = city;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
                selectedClass: updatedUser.selectedClass,
                xp: updatedUser.xp,
                level: updatedUser.level,
                streak: updatedUser.streak,
                avatar: updatedUser.avatar,
                themeColor: updatedUser.themeColor,
                city: updatedUser.city
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                selectedClass: user.selectedClass,
                xp: user.xp,
                level: user.level,
                streak: user.streak,
                avatar: user.avatar,
                themeColor: user.themeColor,
                city: user.city
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { registerUser, loginUser, refreshToken, logoutUser, updateProfile, getProfile };
