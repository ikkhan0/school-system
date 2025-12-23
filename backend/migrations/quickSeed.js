require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('../models/SuperAdmin');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

async function quickSeed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected\n');

        // Test 1: Create Super Admin
        console.log('Creating Super Admin...');
        await SuperAdmin.deleteMany({});

        // Hash password manually to avoid pre-save hook issues
        const hashedSuperAdminPassword = await bcrypt.hash('admin123', 10);

        const superAdmin = await SuperAdmin.create({
            name: 'Super Admin',
            email: 'admin@isoft.com',
            password: hashedSuperAdminPassword,
            phone: '+923001234567',
            is_active: true
        });

        console.log('✅ Super Admin created');
        console.log(`   Email: ${superAdmin.email}`);
        console.log(`   Password: admin123\n`);

        // Test 2: Create Tenant
        console.log('Creating Tenant...');
        await Tenant.deleteMany({});

        const tenant = await Tenant.create({
            tenant_id: 'SCH-001',
            school_name: 'I-Soft College Jhang',
            contact_info: {
                email: 'info@isoftjhang.edu.pk',
                phone: '+923001234567',
                address: 'Main Road, Jhang',
                city: 'Jhang'
            },
            subscription_status: 'Active',
            subscription_plan: 'Premium',
            features_enabled: ['core', 'fees', 'exams'],
            is_active: true
        });
        console.log('✅ Tenant created');
        console.log(`   ID: ${tenant.tenant_id}`);
        console.log(`   Name: ${tenant.school_name}\n`);

        // Test 3: Create School Admin
        console.log('Creating School Admin...');
        await User.deleteMany({});

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            username: 'admin',
            password: hashedPassword,
            full_name: 'School Administrator',
            email: 'admin@isoftjhang.edu.pk',
            role: 'school_admin',
            tenant_id: tenant._id,
            permissions: ['*'],
            is_active: true
        });
        console.log('✅ School Admin created');
        console.log(`   Username: ${admin.username}`);
        console.log(`   Password: admin123\n`);

        console.log('='.repeat(60));
        console.log('✅ QUICK SEED SUCCESSFUL!');
        console.log('='.repeat(60));
        console.log('\n🔐 LOGIN CREDENTIALS:\n');
        console.log('Super Admin:');
        console.log('  Email: admin@isoft.com');
        console.log('  Password: admin123\n');
        console.log('School Admin:');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('='.repeat(60));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

quickSeed();
