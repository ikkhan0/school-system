require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Tenant = require('./models/Tenant');

async function debugLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('Connected to MongoDB\n');

        // Get all tenants
        const tenants = await Tenant.find().sort({ tenant_id: 1 });

        console.log('='.repeat(70));
        console.log('ALL SCHOOLS AND THEIR ADMIN CREDENTIALS');
        console.log('='.repeat(70));
        console.log('');

        for (const tenant of tenants) {
            console.log(`🏫 School: ${tenant.school_name}`);
            console.log(`   Tenant ID: ${tenant.tenant_id}`);
            console.log(`   Status: ${tenant.subscription_status}`);
            console.log(`   Created: ${tenant.createdAt.toLocaleString()}`);
            console.log('');

            // Get all users for this tenant
            const users = await User.find({ tenant_id: tenant._id });

            if (users.length === 0) {
                console.log('   ❌ NO USERS FOUND - This is the problem!');
            } else {
                console.log(`   👥 Users (${users.length}):`);
                users.forEach(u => {
                    console.log(`      Username: ${u.username}`);
                    console.log(`      Name: ${u.full_name}`);
                    console.log(`      Email: ${u.email}`);
                    console.log(`      Role: ${u.role}`);
                    console.log(`      Active: ${u.is_active}`);
                    console.log(`      ---`);
                });
            }
            console.log('');
        }

        console.log('='.repeat(70));
        console.log('LOGIN INSTRUCTIONS');
        console.log('='.repeat(70));
        console.log('URL: http://localhost:3000/');
        console.log('Use the username and password from above');
        console.log('');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.disconnect();
    }
}

debugLogin();
