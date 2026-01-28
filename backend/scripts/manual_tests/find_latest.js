const mongoose = require('mongoose');
const GameResult = require('./models/GameResult');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const result = await GameResult.findOne({
            userId: '69285f0b874d451cfbb37f6b'
        }).sort({ _id: -1 });

        console.log('Absolute Latest Result (by _id):');
        console.log('Game:', result.gameType);
        console.log('Delta:', result.delta);
        console.log('Proficiency:', result.proficiency);
        console.log('Difficulty:', result.difficulty);
        console.log('Subject:', result.subject);
        console.log('ClassLevel:', result.classLevel);
        console.log('Full:', JSON.stringify(result, null, 2));

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

check();
