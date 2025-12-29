// Check Super Admin credentials in MongoDB
// Run from project root: node backend/check-super-admin-password.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function checkSuperAdmin() {
    try {
        // Read .env file manually
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');

        let MONGO_URI = '';
        envContent.split('\n').forEach(line => {
            if (line.startsWith('MONGO_URI=')) {
                MONGO_URI = line.split('=')[1].trim();
            }
        });

        if (!MONGO_URI) {
            console.error('❌ MONGO_URI not found in .env file');
            process.exit(1);
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const SuperAdmins = db.collection('superadmins');

        // Find all super admins
        const admins = await SuperAdmins.find({}).toArray();

        console.log('='.repeat(60));
        console.log('SUPER ADMIN ACCOUNTS IN DATABASE');
        console.log('='.repeat(60));

        if (admins.length === 0) {
            console.log('\n❌ No super admin accounts found!');
            console.log('\nRun this to create one:');
            console.log('node backend/migrations/createSuperAdminQuick.js\n');
        } else {
            for (const admin of admins) {
                console.log('\n📋 Account Details:');
                console.log('   Name:', admin.name);
                console.log('   Email:', admin.email);
                console.log('   Role:', admin.role);
                console.log('   Active:', admin.is_active);
                console.log('   Password Hash:', admin.password.substring(0, 30) + '...');
                console.log('   Created:', admin.createdAt);

                // Test common passwords
                console.log('\n🔐 Testing Common Passwords:');
                const passwords = ['admin123', 'Admin123', 'password', '123456', 'admin@123'];

                for (const pwd of passwords) {
                    const isMatch = await bcrypt.compare(pwd, admin.password);
                    if (isMatch) {
                        console.log(`   ✅ Password "${pwd}" WORKS!`);
                    } else {
                        console.log(`   ❌ "${pwd}" - no match`);
                    }
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('WORKING LOGIN CREDENTIALS:');
        console.log('='.repeat(60));

        if (admins.length > 0) {
            const admin = admins[0];
            console.log('Email:', admin.email);
            console.log('Password: (see test results above)');
        }

        console.log('='.repeat(60) + '\n');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkSuperAdmin();
