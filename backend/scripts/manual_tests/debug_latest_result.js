const mongoose = require('mongoose');
const GameResult = require('./models/GameResult');
require('dotenv').config();

const checkLatest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const latestResult = await GameResult.findOne().sort({ createdAt: -1 });

        if (latestResult) {
            console.log('LATEST RESULT:', JSON.stringify(latestResult, null, 2));
        } else {
            console.log('No game results found.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

checkLatest();
