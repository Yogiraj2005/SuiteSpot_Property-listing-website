const mongoose = require('mongoose');
require('../database');
const User = require('../models/user');

async function seedAdmin() {
    try {
        // Wait for MongoDB connection to be established
        if (mongoose.connection.readyState === 0) {
            await new Promise((resolve) => {
                mongoose.connection.once('open', resolve);
            });
        }
        
        // Remove existing admin user if exists (to fix broken salt/hash)
        await User.deleteOne({ username: 'admin' });

        const newAdmin = new User({
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin'
        });

        // User.register handles hashing and salting automatically
        await User.register(newAdmin, 'admin123');
        console.log('Admin user created successfully!');
        
        // Close connection
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seedAdmin();
