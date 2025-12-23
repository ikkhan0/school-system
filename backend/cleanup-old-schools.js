require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');
const Student = require('./models/Student');
const User = require('./models/User');

async function cleanupOldSchools() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('✅ Connected to MongoDB\n');

        console.log('='.repeat(70));
        console.log('CLEANUP: Deleting old schools without tenant_id');
        console.log('='.repeat(70));
        console.log('');

        // Find all tenants
        const tenants = await Tenant.find();
        console.log(`Found ${tenants.length} schools:\n`);

        for (const tenant of tenants) {
            console.log(`📋 ${tenant.school_name} (${tenant.tenant_id})`);

            // Check if this tenant has any students
            const studentCount = await Student.countDocuments({ tenant_id: tenant._id });
            const oldStudentCount = await Student.countDocuments({
                school_id: { $exists: true },
                tenant_id: null
            });

            console.log(`   Students with tenant_id: ${studentCount}`);
            console.log(`   Old students without tenant_id: ${oldStudentCount}`);

            // Check users
            const userCount = await User.countDocuments({ tenant_id: tenant._id });
            console.log(`   Users: ${userCount}`);
            console.log('');
        }

        // Show old data that needs cleanup
        const oldStudents = await Student.countDocuments({ tenant_id: null });
        const oldUsers = await User.countDocuments({ tenant_id: null, role: { $ne: 'super_admin' } });

        console.log('='.repeat(70));
        console.log('OLD DATA (needs cleanup):');
        console.log('='.repeat(70));
        console.log(`Students without tenant_id: ${oldStudents}`);
        console.log(`Users without tenant_id: ${oldUsers}`);
        console.log('');

        if (oldStudents > 0 || oldUsers > 0) {
            console.log('⚠️  RECOMMENDATION:');
            console.log('1. Delete all existing schools from Super Admin Dashboard');
            console.log('2. Create fresh schools');
            console.log('3. They will have proper tenant isolation');
        } else {
            console.log('✅ No old data found - tenant isolation is working!');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

cleanupOldSchools();
