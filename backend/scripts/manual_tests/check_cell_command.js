const mongoose = require('mongoose');
const GameResult = require('./models/GameResult');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const result = await GameResult.findOne({
            userId: '69285f0b874d451cfbb37f6b',
            gameType: 'cell_command'
        }).sort({ createdAt: -1 });

        console.log('Latest Cell Command Result:');
        console.log(JSON.stringify(result, null, 2));

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

check();
