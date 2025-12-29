require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const School = require('./models/School');
const Tenant = require('./models/Tenant');
const User = require('./models/User');

async function fixTenantAssignment() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('✅ Connected to MongoDB\n');

        console.log('='.repeat(70));
        console.log('FIXING TENANT ASSIGNMENT');
        console.log('='.repeat(70));
        console.log('');

        // Get all tenants and schools
        const tenants = await Tenant.find().sort({ createdAt: 1 });
        const schools = await School.find().sort({ createdAt: 1 });

        console.log(`Found ${tenants.length} tenants and ${schools.length} schools\n`);

        // Map schools to tenants by index (first school -> first tenant, etc.)
        for (let i = 0; i < Math.min(schools.length, tenants.length); i++) {
            const school = schools[i];
            const tenant = tenants[i];

            console.log(`Mapping: ${school.school_name} -> ${tenant.school_name} (${tenant.tenant_id})`);

            // Update students
            const studentResult = await Student.updateMany(
                { school_id: school._id },
                { $set: { tenant_id: tenant._id } }
            );
            console.log(`  Students: ${studentResult.modifiedCount} updated`);

            // Update users (non-super-admin)
            const userResult = await User.updateMany(
                { school_id: school._id, role: { $ne: 'super_admin' } },
                { $set: { tenant_id: tenant._id } }
            );
            console.log(`  Users: ${userResult.modifiedCount} updated`);
            console.log('');
        }

        // Verify
        console.log('='.repeat(70));
        console.log('VERIFICATION');
        console.log('='.repeat(70));
        console.log('');

        for (const tenant of tenants) {
            const studentCount = await Student.countDocuments({ tenant_id: tenant._id });
            const userCount = await User.countDocuments({ tenant_id: tenant._id });
            console.log(`${tenant.school_name} (${tenant.tenant_id}):`);
            console.log(`  Students: ${studentCount}`);
            console.log(`  Users: ${userCount}`);
        }

        console.log('');
        console.log('✅ Done! Now restart the backend and test login.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixTenantAssignment();
