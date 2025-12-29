require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const School = require('./models/School');
const Tenant = require('./models/Tenant');

async function fixTenantMapping() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('✅ Connected to MongoDB\n');

        // Get all schools and tenants
        const schools = await School.find();
        const tenants = await Tenant.find();

        console.log('Schools in database:');
        schools.forEach(s => {
            console.log(`  - ${s.school_name} (ID: ${s._id})`);
        });

        console.log('\nTenants in database:');
        tenants.forEach(t => {
            console.log(`  - ${t.school_name} (${t.tenant_id}) - ID: ${t._id}`);
        });

        // Check students
        console.log('\nStudent distribution:');
        for (const school of schools) {
            const count = await Student.countDocuments({ school_id: school._id });
            console.log(`  ${school.school_name}: ${count} students (school_id: ${school._id})`);
        }

        console.log('\nStudent distribution by tenant_id:');
        for (const tenant of tenants) {
            const count = await Student.countDocuments({ tenant_id: tenant._id });
            console.log(`  ${tenant.school_name}: ${count} students (tenant_id: ${tenant._id})`);
        }

        // Show the mapping issue
        console.log('\n' + '='.repeat(70));
        console.log('PROBLEM IDENTIFIED:');
        console.log('='.repeat(70));
        console.log('All students have the same tenant_id because the migration');
        console.log('mapped all students to the first matching school name.');
        console.log('');
        console.log('SOLUTION: We need to create separate tenants for each school');
        console.log('OR assign students based on their actual school_id.');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.disconnect();
    }
}

fixTenantMapping();
