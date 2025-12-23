require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

async function verifySuperAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const superAdminsCollection = db.collection('superadmins');

        // Find super admin
        const admin = await superAdminsCollection.findOne({ email: 'admin@isoft.com.pk' });

        if (!admin) {
            console.log('❌ No super admin found!');
            console.log('💡 Run: node reset-super-admin.js\n');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log('✅ Super Admin Found:');
        console.log('   Email:', admin.email);
        console.log('   Name:', admin.name);
        console.log('   Active:', admin.is_active);
        console.log('   Password Hash:', admin.password.substring(0, 30) + '...\n');

        // Test password
        const testPassword = 'admin123';
        const isMatch = await bcrypt.compare(testPassword, admin.password);

        console.log('🔐 Password Verification:');
        console.log('   Testing password: admin123');
        console.log('   Result:', isMatch ? '✅ CORRECT' : '❌ INCORRECT\n');

        if (!isMatch) {
            console.log('⚠️  Password does not match!');
            console.log('💡 Run: node reset-super-admin.js to reset password\n');
            await mongoose.disconnect();
            process.exit(1);
        }

        // Test API login
        console.log('\n🌐 Testing API Login...');
        try {
            const response = await axios.post('http://localhost:5000/api/super-admin/login', {
                email: 'admin@isoft.com.pk',
                password: 'admin123'
            });

            console.log('✅ API Login Successful!');
            console.log('   Token:', response.data.token.substring(0, 50) + '...');
            console.log('   User:', response.data.user.name);
            console.log('   Role:', response.data.user.role);
        } catch (apiError) {
            console.log('❌ API Login Failed:');
            console.log('   Error:', apiError.response?.data?.message || apiError.message);
            console.log('\n💡 Make sure backend server is running on port 5000');
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('='.repeat(60));
        console.log('   Email: admin@isoft.com.pk');
        console.log('   Password: admin123');
        console.log('   URL: http://localhost:3000/super-admin/login');
        console.log('='.repeat(60));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifySuperAdmin();
