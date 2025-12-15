const mongoose = require('mongoose');
require('../database');
const User = require('../models/user');

async function seedDemoUsers() {
    try {
        // Wait for MongoDB connection to be established
        if (mongoose.connection.readyState === 0) {
            await new Promise((resolve) => {
                mongoose.connection.once('open', resolve);
            });
        }
        
        // Demo users to create
        const demoUsers = [
            { username: 'admin', email: 'admin@example.com', role: 'admin', password: 'admin123' },
            { username: 'owner', email: 'owner@example.com', role: 'owner', password: 'owner123' },
            { username: 'customer', email: 'customer@example.com', role: 'customer', password: 'customer123' }
        ];

        // Remove existing demo users if they exist
        await User.deleteMany({ username: { $in: ['admin', 'owner', 'customer'] } });
        console.log('Removed existing demo users...');

        // Create each demo user
        for (const userData of demoUsers) {
            const newUser = new User({
                username: userData.username,
                email: userData.email,
                role: userData.role
            });

            // User.register handles hashing and salting automatically
            await User.register(newUser, userData.password);
            console.log(`✓ ${userData.role.toUpperCase()} user created: ${userData.username}`);
        }
        
        console.log('\n✅ All demo users created successfully!');
        console.log('Demo Credentials:');
        console.log('  Admin    - Username: admin    | Password: admin123');
        console.log('  Owner    - Username: owner    | Password: owner123');
        console.log('  Customer - Username: customer | Password: customer123');
        
        // Close connection
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding demo users:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seedDemoUsers();
