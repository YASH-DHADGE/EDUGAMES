const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function listTeachers() {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('name email status');

        console.log(`\n👨‍🏫 Teachers in database: ${teachers.length}\n`);

        if (teachers.length === 0) {
            console.log('No teachers found!');
        } else {
            teachers.forEach((t, idx) => {
                console.log(`${idx + 1}. ${t.name}`);
                console.log(`   Email: ${t.email}`);
                console.log(`   Status: ${t.status}`);
                console.log(`   ID: ${t._id}\n`);
            });
        }

        // Also create Sarvesh if not exists
        let sarvesh = await User.findOne({ email: 'sarvesh@school.edu' });

        if (!sarvesh) {
            console.log('Creating teacher account: Sarvesh...');
            const hashedPassword = await bcrypt.hash('password123', 10);

            sarvesh = await User.create({
                name: 'Sarvesh',
                email: 'sarvesh@school.edu',
                password: hashedPassword,
                role: 'teacher',
                status: 'active',
                xp: 10000,
                streak: 50,
            });

            console.log('✅ Created Sarvesh!');
            console.log(`   Email: ${sarvesh.email}`);
            console.log(`   Password: password123`);
            console.log(`   ID: ${sarvesh._id}\n`);
        } else {
            console.log(`✅ Sarvesh already exists: ${sarvesh.email}\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listTeachers();
