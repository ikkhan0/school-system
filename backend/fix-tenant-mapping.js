require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const School = require('./models/School');
const Tenant = require('./models/Tenant');

async function createProperTenantMapping() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('✅ Connected to MongoDB\n');

        console.log('='.repeat(70));
        console.log('CREATING PROPER TENANT MAPPING');
        console.log('='.repeat(70));
        console.log('');

        // Get all schools
        const schools = await School.find();
        console.log(`Found ${schools.length} schools\n`);

        // For each school, create or find a tenant
        for (const school of schools) {
            console.log(`Processing: ${school.school_name}`);

            // Find or create tenant for this school
            let tenant = await Tenant.findOne({ school_name: school.school_name });

            if (!tenant) {
                // Create new tenant
                const tenantId = await Tenant.generateTenantId();
                tenant = await Tenant.create({
                    tenant_id: tenantId,
                    school_name: school.school_name,
                    contact_info: {
                        email: school.email || '',
                        phone: school.phone || '',
                        address: school.address || '',
                        city: school.city || ''
                    },
                    subscription_plan: 'Free',
                    features_enabled: ['core'],
                    subscription_status: 'Active'
                });
                console.log(`  ✅ Created tenant: ${tenant.tenant_id}`);
            } else {
                console.log(`  ℹ️  Tenant already exists: ${tenant.tenant_id}`);
            }

            // Update all students for this school
            const result = await Student.updateMany(
                { school_id: school._id },
                { $set: { tenant_id: tenant._id } }
            );

            console.log(`  📝 Updated ${result.modifiedCount} students`);
            console.log('');
        }

        // Verify the results
        console.log('='.repeat(70));
        console.log('VERIFICATION');
        console.log('='.repeat(70));
        console.log('');

        const tenants = await Tenant.find();
        for (const tenant of tenants) {
            const studentCount = await Student.countDocuments({ tenant_id: tenant._id });
            console.log(`${tenant.school_name} (${tenant.tenant_id}): ${studentCount} students`);
        }

        console.log('');
        console.log('✅ Tenant mapping complete!');
        console.log('✅ Each school now has its own tenant_id');
        console.log('✅ Students are properly assigned to their schools');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createProperTenantMapping();
