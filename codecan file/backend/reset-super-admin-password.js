// Reset Super Admin Password
// Run from project root: node backend/reset-super-admin-password.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function resetPassword() {
    try {
        // Read .env file manually
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');

        let MONGO_URI = '';
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('MONGO_URI=')) {
                MONGO_URI = trimmed.substring('MONGO_URI='.length).trim();
                // Remove quotes if present
                MONGO_URI = MONGO_URI.replace(/^["']|["']$/g, '');
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

        // Find super admin by email
        const email = 'admin@school.com';
        const admin = await SuperAdmins.findOne({ email });

        if (!admin) {
            console.log('❌ No super admin found with email:', email);
            console.log('\nCreating new super admin...\n');

            const newPassword = 'admin123';
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await SuperAdmins.insertOne({
                name: 'Super Administrator',
                email: email,
                password: hashedPassword,
                role: 'super_admin',
                phone: '',
                is_active: true,
                permissions: ['*'],
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('='.repeat(60));
            console.log('✅ NEW SUPER ADMIN CREATED!');
            console.log('='.repeat(60));
            console.log('\nLogin Credentials:');
            console.log('Email:', email);
            console.log('Password: admin123');
            console.log('\n' + '='.repeat(60));

        } else {
            console.log('📋 Found Super Admin:');
            console.log('   Name:', admin.name);
            console.log('   Email:', admin.email);
            console.log('\n🔄 Resetting password to: admin123\n');

            const newPassword = 'admin123';
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await SuperAdmins.updateOne(
                { email },
                {
                    $set: {
                        password: hashedPassword,
                        updatedAt: new Date()
                    }
                }
            );

            console.log('='.repeat(60));
            console.log('✅ PASSWORD RESET SUCCESSFUL!');
            console.log('='.repeat(60));
            console.log('\nLogin Credentials:');
            console.log('Email:', email);
            console.log('Password: admin123');
            console.log('\n' + '='.repeat(60));
        }

        await mongoose.disconnect();
        console.log('\n✅ Done!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nFull error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

resetPassword();
