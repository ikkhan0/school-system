// Direct test of password matching
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('./models/SuperAdmin');

async function testPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const admin = await SuperAdmin.findOne({ email: 'admin@isoft.com.pk' });

        if (!admin) {
            console.log('❌ Super admin not found!');
            return;
        }

        console.log('✅ Super admin found');
        console.log('Email:', admin.email);
        console.log('Password hash:', admin.password.substring(0, 20) + '...');

        // Test password
        const testPassword = 'admin123';
        const isMatch = await bcrypt.compare(testPassword, admin.password);

        console.log('\n🔐 Password Test:');
        console.log('Testing password:', testPassword);
        console.log('Match:', isMatch ? '✅ YES' : '❌ NO');

        // Also test with model method
        if (admin.matchPassword) {
            const isMatchModel = await admin.matchPassword(testPassword);
            console.log('Match (model method):', isMatchModel ? '✅ YES' : '❌ NO');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

testPassword();
