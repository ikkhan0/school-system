// Quick script to create super admin in MongoDB Atlas
// Run this locally: node backend/migrations/createSuperAdminQuick.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const SuperAdmins = db.collection('superadmins');

        // Check if super admin exists
        const existing = await SuperAdmins.findOne({ email: 'admin@school.com' });

        if (existing) {
            console.log('⚠️  Super Admin already exists!');
            console.log('Email:', existing.email);
            console.log('\nIf you forgot the password, delete this admin first and run again.');
            await mongoose.disconnect();
            return;
        }

        // Create super admin
        const password = 'admin123'; // Change this!
        const hashedPassword = await bcrypt.hash(password, 10);

        await SuperAdmins.insertOne({
            name: 'Super Administrator',
            email: 'admin@school.com',
            password: hashedPassword,
            role: 'super_admin',
            phone: '',
            is_active: true,
            permissions: ['*'],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('='.repeat(60));
        console.log('✅ Super Admin Created Successfully!');
        console.log('='.repeat(60));
        console.log('\nLogin Credentials:');
        console.log('Email: admin@school.com');
        console.log('Password: admin123');
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
        console.log('='.repeat(60));

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createSuperAdmin();
