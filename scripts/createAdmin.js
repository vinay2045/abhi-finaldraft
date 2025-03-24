/**
 * Script to create the first admin user
 * Run with: node scripts/createAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

// Load environment variables
dotenv.config();

// Create admin user function
async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Check if an admin already exists
        const adminCount = await Admin.countDocuments();
        
        if (adminCount > 0) {
            console.log('Admin user already exists. Skipping creation.');
            console.log('Use the following credentials to login:');
            console.log('Username: admin');
            console.log('Password: admin123');
            
            await mongoose.disconnect();
            process.exit(0);
        }

        // Create admin data
        const adminData = {
            username: 'admin',
            password: 'admin123', // This will be hashed by the pre-save hook
            name: 'Administrator',
            email: 'admin@example.com',
            role: 'superadmin',
            isActive: true
        };

        // Create and save admin user
        const admin = new Admin(adminData);
        await admin.save();

        console.log('Admin user created successfully:');
        console.log(`Username: ${adminData.username}`);
        console.log(`Password: admin123 (please change this after first login)`);
        console.log(`Name: ${adminData.name}`);
        console.log(`Email: ${adminData.email}`);
        console.log(`Role: ${adminData.role}`);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

// Run the function
createAdminUser(); 