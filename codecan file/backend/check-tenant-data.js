require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Tenant = require('./models/Tenant');

async function checkTenantData() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('✅ Connected to MongoDB\n');

        // Get all tenants
        const tenants = await Tenant.find().sort({ tenant_id: 1 });

        console.log('='.repeat(70));
        console.log('TENANT DATA CHECK');
        console.log('='.repeat(70));
        console.log('');

        for (const tenant of tenants) {
            console.log(`📋 ${tenant.school_name} (${tenant.tenant_id})`);
            console.log(`   Tenant _id: ${tenant._id}`);

            // Check students
            const studentsWithTenant = await Student.countDocuments({ tenant_id: tenant._id });
            const studentsWithoutTenant = await Student.countDocuments({ tenant_id: null });
            const totalStudents = await Student.countDocuments({});

            console.log(`   Students with this tenant_id: ${studentsWithTenant}`);
            console.log(`   Students without tenant_id: ${studentsWithoutTenant}`);
            console.log(`   Total students in DB: ${totalStudents}`);
            console.log('');
        }

        // Show sample student data
        const sampleStudents = await Student.find().limit(3).select('full_name school_id tenant_id');
        console.log('Sample Students:');
        sampleStudents.forEach(s => {
            console.log(`  - ${s.full_name}`);
            console.log(`    school_id: ${s.school_id}`);
            console.log(`    tenant_id: ${s.tenant_id || 'NULL'}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.disconnect();
    }
}

checkTenantData();
