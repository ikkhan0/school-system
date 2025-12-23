require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

console.log('🔄 Starting Multi-Tenant Migration...\n');

async function migrateToMultiTenant() {
    try {
        // Connect to database
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Step 1: Get existing school
        console.log('📋 Step 1: Checking existing school...');
        const School = require('../models/School');
        const existingSchool = await School.findOne();

        if (!existingSchool) {
            console.log('❌ No existing school found. Please create a school first.');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`   Found school: ${existingSchool.school_name}`);

        // Step 2: Create first tenant from existing school
        console.log('\n📋 Step 2: Creating first tenant...');
        const Tenant = require('../models/Tenant');

        let tenant = await Tenant.findOne({ school_name: existingSchool.school_name });

        if (tenant) {
            console.log(`   ⚠️  Tenant already exists: ${tenant.tenant_id}`);
        } else {
            const tenant_id = await Tenant.generateTenantId();

            tenant = await Tenant.create({
                tenant_id,
                school_name: existingSchool.school_name,
                logo_url: existingSchool.logo || '',
                contact_info: {
                    email: existingSchool.email || 'admin@school.com',
                    phone: existingSchool.phone || '',
                    address: existingSchool.address || '',
                    city: existingSchool.city || '',
                    country: 'Pakistan'
                },
                subscription_status: 'Active',
                subscription_plan: 'Premium',
                features_enabled: ['core', 'fees', 'exams', 'attendance', 'reports', 'sms'],
                is_active: true
            });

            console.log(`   ✅ Created tenant: ${tenant.tenant_id} - ${tenant.school_name}`);
        }

        // Step 3: Update all users with tenant_id
        console.log('\n📋 Step 3: Updating users with tenant_id...');
        const usersCollection = db.collection('users');
        const usersToUpdate = await usersCollection.countDocuments({ tenant_id: { $exists: false } });

        if (usersToUpdate > 0) {
            await usersCollection.updateMany(
                { tenant_id: { $exists: false } },
                {
                    $set: {
                        tenant_id: tenant._id,
                        permissions: ['*']
                    }
                }
            );
            console.log(`   ✅ Updated ${usersToUpdate} users`);
        } else {
            console.log(`   ℹ️  All users already have tenant_id`);
        }

        // Step 4: Add tenant_id to all collections
        const collectionNames = [
            'students',
            'staffs',
            'classes',
            'subjects',
            'fees',
            'families',
            'exams',
            'examresults',
            'dailylogs',
            'discountpolicies',
            'salaries',
            'staffattendances'
        ];

        console.log('\n📋 Step 4: Adding tenant_id to all collections...');

        for (const collectionName of collectionNames) {
            try {
                const collection = db.collection(collectionName);
                const exists = await db.listCollections({ name: collectionName }).hasNext();

                if (!exists) {
                    console.log(`   ⚠️  ${collectionName}: Collection does not exist, skipping`);
                    continue;
                }

                const docsToUpdate = await collection.countDocuments({ tenant_id: { $exists: false } });

                if (docsToUpdate > 0) {
                    await collection.updateMany(
                        { tenant_id: { $exists: false } },
                        { $set: { tenant_id: tenant._id } }
                    );
                    console.log(`   ✅ ${collectionName}: Updated ${docsToUpdate} documents`);
                } else {
                    const totalDocs = await collection.countDocuments();
                    console.log(`   ℹ️  ${collectionName}: All ${totalDocs} documents already have tenant_id`);
                }
            } catch (error) {
                console.log(`   ⚠️  ${collectionName}: ${error.message}`);
            }
        }

        // Step 5: Verification
        console.log('\n📋 Step 5: Verification...');
        const stats = {
            tenants: await db.collection('tenants').countDocuments(),
            users: await db.collection('users').countDocuments({ tenant_id: tenant._id }),
            students: await db.collection('students').countDocuments({ tenant_id: tenant._id }),
            staff: await db.collection('staffs').countDocuments({ tenant_id: tenant._id }),
            classes: await db.collection('classes').countDocuments({ tenant_id: tenant._id }),
            fees: await db.collection('fees').countDocuments({ tenant_id: tenant._id })
        };

        console.log('\n' + '='.repeat(60));
        console.log('✅ Migration Completed Successfully!');
        console.log('='.repeat(60));
        console.log(`\n📊 Migration Summary:`);
        console.log(`   Tenant ID: ${tenant.tenant_id}`);
        console.log(`   School Name: ${tenant.school_name}`);
        console.log(`   Subscription: ${tenant.subscription_plan} (${tenant.subscription_status})`);
        console.log(`\n📈 Data Summary:`);
        console.log(`   Total Tenants: ${stats.tenants}`);
        console.log(`   Users: ${stats.users}`);
        console.log(`   Students: ${stats.students}`);
        console.log(`   Staff: ${stats.staff}`);
        console.log(`   Classes: ${stats.classes}`);
        console.log(`   Fees: ${stats.fees}`);
        console.log('\n' + '='.repeat(60));

        console.log('\n🎯 Next Steps:');
        console.log('   1. Run: node migrations/createSuperAdmin.js');
        console.log('   2. Test the Super Admin login');
        console.log('   3. Verify tenant isolation is working');
        console.log('   4. Build the Super Admin frontend dashboard');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration Error:', error);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure MongoDB is running');
        console.error('   2. Check your .env file has MONGO_URI');
        console.error('   3. Ensure you have a backup of your data');
        console.error('   4. Review the error message above');
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run migration
migrateToMultiTenant();
