const User = require('../models/User');

const seedAdmin = async () => {
    try {
        console.log('🔒 Checking Admin User...');
        const adminExists = await User.findOne({ email: 'admin@system.com' });

        if (adminExists) {
            console.log('   ✓ Admin user already exists');
            return;
        }

        await User.create({
            name: 'System Admin',
            email: 'admin@system.com',
            password: 'Admin@123',
            role: 'admin',
            status: 'active'
        });

        console.log('   ✓ Admin user created successfully');
    } catch (error) {
        console.error('   ❌ Error seeding admin:', error.message);
        throw error;
    }
};

module.exports = seedAdmin;
