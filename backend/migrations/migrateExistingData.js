require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const School = require('../models/School');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

console.log('🔄 Starting Data Migration to Multi-Tenant...\n');

async function migrateData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Step 1: Check if migration already done
        const existingTenants = await Tenant.countDocuments();
        if (existingTenants > 0) {
            console.log('⚠️  Migration already completed. Tenants exist.');
            console.log(`   Found ${existingTenants} tenant(s)\n`);

            const tenants = await Tenant.find();
            tenants.forEach(t => {
                console.log(`   - ${t.school_name} (${t.tenant_id})`);
            });

            await mongoose.disconnect();
            process.exit(0);
        }

        // Step 2: Get existing school
        console.log('📋 Step 1: Finding existing school...');
        const existingSchool = await School.findOne();

        if (!existingSchool) {
            console.log('❌ No existing school found.');
            console.log('   Creating default school...\n');

            const defaultSchool = await School.create({
                school_name: 'I-Soft School Management System',
                email: 'admin@school.com',
                phone: '+923001234567',
                address: 'Main Road',
                city: 'City'
            });

            console.log(`   ✅ Created default school: ${defaultSchool.school_name}\n`);
        } else {
            console.log(`   ✅ Found school: ${existingSchool.school_name}\n`);
        }

        const school = existingSchool || await School.findOne();

        // Step 3: Create first tenant
        console.log('📋 Step 2: Creating first tenant...');

        const tenant = await Tenant.create({
            tenant_id: 'SCH-001',
            school_name: school.school_name,
            logo_url: school.logo || '',
            contact_info: {
                email: school.email || 'admin@school.com',
                phone: school.phone || '+923001234567',
                address: school.address || '',
                city: school.city || '',
                country: 'Pakistan'
            },
            subscription_status: 'Active',
            subscription_plan: 'Premium',
            features_enabled: ['core', 'fees', 'exams', 'attendance', 'reports', 'sms'],
            is_active: true
        });

        console.log(`   ✅ Created tenant: ${tenant.tenant_id} - ${tenant.school_name}\n`);

        // Step 4: Update all users
        console.log('📋 Step 3: Updating users...');
        const usersUpdated = await User.updateMany(
            { tenant_id: { $exists: false } },
            {
                $set: {
                    tenant_id: tenant._id,
                    permissions: ['*']
                }
            }
        );
        console.log(`   ✅ Updated ${usersUpdated.modifiedCount} users\n`);

        // Step 5: Add tenant_id to all collections
        const collections = [
            'students', 'staffs', 'classes', 'subjects', 'fees',
            'families', 'exams', 'examresults', 'dailylogs',
            'discountpolicies', 'salaries', 'staffattendances'
        ];

        console.log('📋 Step 4: Adding tenant_id to collections...');

        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                const exists = await db.listCollections({ name: collectionName }).hasNext();

                if (!exists) {
                    console.log(`   ⚠️  ${collectionName}: Does not exist, skipping`);
                    continue;
                }

                const result = await collection.updateMany(
                    { tenant_id: { $exists: false } },
                    { $set: { tenant_id: tenant._id } }
                );

                if (result.modifiedCount > 0) {
                    console.log(`   ✅ ${collectionName}: Updated ${result.modifiedCount} documents`);
                } else {
                    const total = await collection.countDocuments();
                    console.log(`   ℹ️  ${collectionName}: ${total} documents already have tenant_id`);
                }
            } catch (error) {
                console.log(`   ⚠️  ${collectionName}: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(70));
        console.log(`\n📊 Summary:`);
        console.log(`   Tenant ID: ${tenant.tenant_id}`);
        console.log(`   School: ${tenant.school_name}`);
        console.log(`   Status: ${tenant.subscription_status}`);
        console.log(`   Plan: ${tenant.subscription_plan}`);
        console.log('\n' + '='.repeat(70));
        console.log('\n🎯 Next Steps:');
        console.log('   1. Create Super Admin via API or Postman');
        console.log('   2. Login to Super Admin dashboard');
        console.log('   3. Create additional schools if needed');
        console.log('   4. Test tenant isolation\n');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateData();
