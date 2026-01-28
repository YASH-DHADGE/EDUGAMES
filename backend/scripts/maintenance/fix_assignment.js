const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./models/User');

async function fixStudents() {
    try {
        // Find Sarvesh by email
        const sarvesh = await User.findOne({ email: 'sarvesh@gmail.com' });

        if (!sarvesh) {
            console.log('ERROR: Sarvesh not found');
            process.exit(1);
        }

        console.log('Sarvesh ID:', sarvesh._id.toString());

        // Find Divyesh
        const divyesh = await User.findOne({ email: 'divyeshravane21543@gmail.com' });

        if (!divyesh) {
            console.log('ERROR: Divyesh not found');
            process.exit(1);
        }

        console.log('Divyesh current teacher ID:', divyesh.teacherId ? divyesh.teacherId.toString() : 'NONE');
        console.log('Divyesh status:', divyesh.status);

        // Update Divyesh to be assigned to Sarvesh
        divyesh.teacherId = sarvesh._id;
        divyesh.status = 'active';
        await divyesh.save();

        console.log('UPDATED Divyesh teacher ID:', divyesh.teacherId.toString());

        // Verify
        const students = await User.find({
            role: 'student',
            teacherId: sarvesh._id
        });

        console.log('Students assigned to Sarvesh:', students.length);
        students.forEach(s => console.log('  -', s.name, s.email));

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error.message);
        process.exit(1);
    }
}

fixStudents();
