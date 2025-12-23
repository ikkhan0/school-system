require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

async function createSuperAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const superAdminsCollection = db.collection('superadmins');

        // Check if exists
        const existing = await superAdminsCollection.findOne({ email: 'admin@isoft.com.pk' });
        if (existing) {
            console.log('⚠️  Deleting existing super admin...');
            await superAdminsCollection.deleteOne({ email: 'admin@isoft.com.pk' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Insert directly
        await superAdminsCollection.insertOne({
            name: 'Super Administrator',
            email: 'admin@isoft.com.pk',
            password: hashedPassword,
            role: 'super_admin',
            phone: '+923001234567',
            is_active: true,
            permissions: ['*'],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ Super Admin created successfully!\n');
        console.log('='.repeat(60));
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('='.repeat(60));
        console.log('   Email: admin@isoft.com.pk');
        console.log('   Password: admin123');
        console.log('   URL: http://localhost:3000/super-admin/login');
        console.log('='.repeat(60));
        console.log('\n🎯 Now try logging in!\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createSuperAdmin();
