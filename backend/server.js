const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/learn', require('./routes/learn'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/institute', require('./routes/instituteRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/games', require('./routes/games'));
app.use('/api/science', require('./routes/science'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/xp', require('./routes/xpRoutes'));
app.use('/api/streak', require('./routes/streakRoutes'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/approval', require('./routes/approval'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Base route
app.get('/', (req, res) => {
    res.send('Rural Learning App API is running');
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://192.168.1.7:${PORT}`);
});
