require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

async function resetSuperAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const superAdminsCollection = db.collection('superadmins');

        // Delete ALL existing super admins
        const deleteResult = await superAdminsCollection.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing super admin(s)\n`);

        // Hash password with bcrypt
        const plainPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        console.log('🔐 Password Details:');
        console.log('   Plain text: admin123');
        console.log('   Hash: ' + hashedPassword.substring(0, 30) + '...\n');

        // Insert new super admin
        const result = await superAdminsCollection.insertOne({
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

        // Verify the password works
        const admin = await superAdminsCollection.findOne({ email: 'admin@isoft.com.pk' });
        const isMatch = await bcrypt.compare(plainPassword, admin.password);

        console.log('🔍 Verification:');
        console.log('   Password match test:', isMatch ? '✅ PASSED' : '❌ FAILED');
        console.log('   Email:', admin.email);
        console.log('   Active:', admin.is_active);

        console.log('\n' + '='.repeat(60));
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('='.repeat(60));
        console.log('   Email: admin@isoft.com.pk');
        console.log('   Password: admin123');
        console.log('   URL: http://localhost:3000/super-admin/login');
        console.log('='.repeat(60));
        console.log('\n🎯 You can now login!\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

resetSuperAdmin();
