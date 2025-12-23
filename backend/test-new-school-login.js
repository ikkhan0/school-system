require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Tenant = require('./models/Tenant');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

async function testNewSchoolLogin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the most recently created tenant
        const latestTenant = await Tenant.findOne().sort({ createdAt: -1 });

        if (!latestTenant) {
            console.log('❌ No tenants found!');
            await mongoose.disconnect();
            return;
        }

        console.log('📋 Latest Tenant:');
        console.log('   School Name:', latestTenant.school_name);
        console.log('   Tenant ID:', latestTenant.tenant_id);
        console.log('   MongoDB _id:', latestTenant._id);
        console.log('');

        // Find admin user for this tenant
        const adminUser = await User.findOne({
            tenant_id: latestTenant._id,
            role: 'school_admin'
        });

        if (!adminUser) {
            console.log('❌ No admin user found for this tenant!');
            console.log('💡 This is the problem - admin user was not created properly');
            await mongoose.disconnect();
            return;
        }

        console.log('✅ Admin User Found:');
        console.log('   Username:', adminUser.username);
        console.log('   Full Name:', adminUser.full_name);
        console.log('   Email:', adminUser.email);
        console.log('   Role:', adminUser.role);
        console.log('   Active:', adminUser.is_active);
        console.log('   Password Hash:', adminUser.password.substring(0, 30) + '...');
        console.log('');

        // Test password with a common password
        const testPasswords = ['admin123', 'password', '123456', 'admin'];

        console.log('🔐 Testing Common Passwords:');
        for (const testPwd of testPasswords) {
            const isMatch = await bcrypt.compare(testPwd, adminUser.password);
            console.log(`   ${testPwd}: ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        }
        console.log('');

        console.log('💡 To login with this user:');
        console.log('   URL: http://localhost:3000/');
        console.log('   Username:', adminUser.username);
        console.log('   Password: (the password you set when creating the school)');
        console.log('');

        // List all users for this tenant
        const allUsers = await User.find({ tenant_id: latestTenant._id });
        console.log(`📊 Total users for this tenant: ${allUsers.length}`);
        allUsers.forEach(u => {
            console.log(`   - ${u.username} (${u.role}) - Active: ${u.is_active}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await mongoose.disconnect();
    }
}

testNewSchoolLogin();
