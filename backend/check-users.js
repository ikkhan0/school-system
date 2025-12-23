require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Tenant = require('./models/Tenant');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('Connected to MongoDB\n');

        // Get all tenants
        const tenants = await Tenant.find().sort({ createdAt: -1 });
        console.log(`Total Tenants: ${tenants.length}\n`);

        for (const tenant of tenants) {
            console.log(`Tenant: ${tenant.school_name} (${tenant.tenant_id})`);
            console.log(`  Created: ${tenant.createdAt}`);

            // Get users for this tenant
            const users = await User.find({ tenant_id: tenant._id });
            console.log(`  Users: ${users.length}`);

            users.forEach(u => {
                console.log(`    - ${u.username} | ${u.full_name} | ${u.role} | Active: ${u.is_active}`);
            });
            console.log('');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.disconnect();
    }
}

checkUsers();
