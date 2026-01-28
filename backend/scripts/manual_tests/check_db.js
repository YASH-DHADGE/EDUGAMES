const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Class = require('./models/Class');

dotenv.config();

const checkData = async () => {
    try {
        // Use local URI directly to test
        await mongoose.connect('mongodb://localhost:27017/rural_learning_db');
        console.log('MongoDB Connected');
        const count = await Class.countDocuments();
        console.log(`Class count: ${count}`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
