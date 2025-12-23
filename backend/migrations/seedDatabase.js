require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const SuperAdmin = require('../models/SuperAdmin');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Family = require('../models/Family');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

console.log('🌱 Starting Database Seeding...\n');

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // ==================== STEP 1: CREATE SUPER ADMIN ====================
        console.log('👤 Step 1: Creating Super Admin...');

        await SuperAdmin.deleteMany({}); // Clear existing

        const superAdmin = await SuperAdmin.create({
            name: 'Super Administrator',
            email: 'admin@isoft.com',
            password: 'admin123', // Will be hashed automatically (min 6 chars)
            phone: '+923001234567'
        });

        console.log(`   ✅ Super Admin created`);
        console.log(`      Email: admin@isoft.com`);
        console.log(`      Password: admin123\n`);

        // ==================== STEP 2: CREATE SCHOOLS (TENANTS) ====================
        console.log('🏫 Step 2: Creating Schools...\n');

        await Tenant.deleteMany({}); // Clear existing

        // School 1: I-Soft College Jhang (Your real school)
        const school1 = await Tenant.create({
            tenant_id: 'SCH-001',
            school_name: 'I-Soft College Jhang',
            logo_url: '',
            contact_info: {
                email: 'info@isoftjhang.edu.pk',
                phone: '+923001234567',
                address: 'Main Road, Jhang',
                city: 'Jhang',
                country: 'Pakistan'
            },
            subscription_status: 'Active',
            subscription_plan: 'Premium',
            features_enabled: ['core', 'fees', 'exams', 'attendance', 'reports', 'sms', 'transport'],
            is_active: true,
            max_students: 500,
            max_staff: 50
        });

        console.log(`   ✅ School 1: ${school1.school_name} (${school1.tenant_id})`);

        // School 2: Dummy School for Testing
        const school2 = await Tenant.create({
            tenant_id: 'SCH-002',
            school_name: 'Green Valley School',
            logo_url: '',
            contact_info: {
                email: 'info@greenvalley.edu.pk',
                phone: '+923009876543',
                address: 'Garden Town, Lahore',
                city: 'Lahore',
                country: 'Pakistan'
            },
            subscription_status: 'Active',
            subscription_plan: 'Basic',
            features_enabled: ['core', 'fees', 'exams', 'attendance'],
            is_active: true,
            max_students: 200,
            max_staff: 20
        });

        console.log(`   ✅ School 2: ${school2.school_name} (${school2.tenant_id})\n`);

        // ==================== STEP 2.5: CREATE LEGACY SCHOOL RECORDS ====================
        console.log('🏫 Step 2.5: Creating legacy School records...\n');

        await School.deleteMany({}); // Clear existing

        // Create School record for School 1 (for backward compatibility)
        const legacySchool1 = await School.create({
            school_name: school1.school_name,
            email: school1.contact_info.email,
            phone: school1.contact_info.phone,
            address: school1.contact_info.address,
            city: school1.contact_info.city,
            logo: school1.logo_url
        });

        // Create School record for School 2
        const legacySchool2 = await School.create({
            school_name: school2.school_name,
            email: school2.contact_info.email,
            phone: school2.contact_info.phone,
            address: school2.contact_info.address,
            city: school2.contact_info.city,
            logo: school2.logo_url
        });

        console.log(`   ✅ Created legacy School records for backward compatibility\n`);

        // ==================== STEP 3: CREATE SCHOOL ADMINS ====================
        console.log('👨‍💼 Step 3: Creating School Admins...\n');

        await User.deleteMany({}); // Clear existing

        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Admin for School 1
        const admin1 = await User.create({
            username: 'admin',
            password: hashedPassword,
            full_name: 'Admin I-Soft Jhang',
            email: 'admin@isoftjhang.edu.pk',
            role: 'school_admin',
            tenant_id: school1._id,
            permissions: ['*'],
            is_active: true
        });

        console.log(`   ✅ Admin 1 (I-Soft College Jhang)`);
        console.log(`      Username: admin`);
        console.log(`      Password: admin123`);

        // Admin for School 2
        const admin2 = await User.create({
            username: 'greenadmin',
            password: hashedPassword,
            full_name: 'Admin Green Valley',
            email: 'admin@greenvalley.edu.pk',
            role: 'school_admin',
            tenant_id: school2._id,
            permissions: ['*'],
            is_active: true
        });

        console.log(`   ✅ Admin 2 (Green Valley School)`);
        console.log(`      Username: greenadmin`);
        console.log(`      Password: admin123\n`);

        // ==================== STEP 4: CREATE CLASSES ====================
        console.log('📚 Step 4: Creating Classes...\n');

        await Class.deleteMany({}); // Clear existing

        // Classes for School 1
        const classes1 = [];
        for (let i = 1; i <= 10; i++) {
            const cls = await Class.create({
                name: String(i),
                sections: ['A', 'B', 'C'],
                school_id: legacySchool1._id,
                tenant_id: school1._id
            });
            classes1.push(cls);
        }
        console.log(`   ✅ Created ${classes1.length} classes for I-Soft College Jhang`);

        // Classes for School 2
        const classes2 = [];
        for (let i = 1; i <= 8; i++) {
            const cls = await Class.create({
                name: String(i),
                sections: ['A', 'B'],
                school_id: legacySchool2._id,
                tenant_id: school2._id
            });
            classes2.push(cls);
        }
        console.log(`   ✅ Created ${classes2.length} classes for Green Valley School\n`);

        // ==================== STEP 5: CREATE STUDENTS ====================
        console.log('👨‍🎓 Step 5: Creating Students...\n');

        await Student.deleteMany({}); // Clear existing
        await Family.deleteMany({}); // Clear existing

        // Students for School 1 (I-Soft College Jhang)
        const students1Names = [
            { name: 'Ahmed Ali', father: 'Ali Khan', mobile: '+923001111111' },
            { name: 'Fatima Hassan', father: 'Hassan Ahmed', mobile: '+923002222222' },
            { name: 'Muhammad Usman', father: 'Usman Malik', mobile: '+923003333333' },
            { name: 'Ayesha Khan', father: 'Khan Sahib', mobile: '+923004444444' },
            { name: 'Omar Farooq', father: 'Farooq Ahmed', mobile: '+923005555555' },
            { name: 'Zainab Ali', father: 'Ali Raza', mobile: '+923006666666' },
            { name: 'Hassan Raza', father: 'Raza Hussain', mobile: '+923007777777' },
            { name: 'Maryam Noor', father: 'Noor Ahmed', mobile: '+923008888888' },
            { name: 'Abdullah Shah', father: 'Shah Jahan', mobile: '+923009999999' },
            { name: 'Hira Malik', father: 'Malik Saeed', mobile: '+923000000000' }
        ];

        for (let i = 0; i < students1Names.length; i++) {
            const student = students1Names[i];
            const classIndex = i % 3; // Distribute across first 3 classes
            const section = ['A', 'B', 'C'][i % 3];

            // Create family
            const family = await Family.create({
                father_name: student.father,
                father_mobile: student.mobile,
                school_id: legacySchool1._id,
                tenant_id: school1._id
            });

            // Create student
            await Student.create({
                roll_no: String(i + 1).padStart(3, '0'),
                full_name: student.name,
                father_name: student.father,
                father_mobile: student.mobile,
                class_id: classes1[classIndex].name,
                section_id: section,
                gender: i % 2 === 0 ? 'Male' : 'Female',
                monthly_fee: 5000,
                is_active: true,
                school_id: legacySchool1._id,
                tenant_id: school1._id,
                family_id: family._id
            });
        }
        console.log(`   ✅ Created ${students1Names.length} students for I-Soft College Jhang`);

        // Students for School 2 (Green Valley)
        const students2Names = [
            { name: 'Sara Ahmed', father: 'Ahmed Raza', mobile: '+923101111111' },
            { name: 'Bilal Khan', father: 'Khan Bahadur', mobile: '+923102222222' },
            { name: 'Amina Tariq', father: 'Tariq Mehmood', mobile: '+923103333333' },
            { name: 'Hamza Ali', father: 'Ali Akbar', mobile: '+923104444444' },
            { name: 'Nida Fatima', father: 'Fatima Javed', mobile: '+923105555555' }
        ];

        for (let i = 0; i < students2Names.length; i++) {
            const student = students2Names[i];
            const classIndex = i % 2; // Distribute across first 2 classes
            const section = ['A', 'B'][i % 2];

            // Create family
            const family = await Family.create({
                father_name: student.father,
                father_mobile: student.mobile,
                school_id: legacySchool2._id,
                tenant_id: school2._id
            });

            // Create student
            await Student.create({
                roll_no: String(i + 1).padStart(3, '0'),
                full_name: student.name,
                father_name: student.father,
                father_mobile: student.mobile,
                class_id: classes2[classIndex].name,
                section_id: section,
                gender: i % 2 === 0 ? 'Female' : 'Male',
                monthly_fee: 4000,
                is_active: true,
                school_id: legacySchool2._id,
                tenant_id: school2._id,
                family_id: family._id
            });
        }
        console.log(`   ✅ Created ${students2Names.length} students for Green Valley School\n`);

        // ==================== SUMMARY ====================
        console.log('='.repeat(70));
        console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(70));

        console.log('\n🔐 LOGIN CREDENTIALS:\n');

        console.log('📌 SUPER ADMIN (Full System Access):');
        console.log('   URL: /super-admin/login');
        console.log('   Email: admin@isoft.com');
        console.log('   Password: admin123');
        console.log('   Access: Manage all schools, impersonate users\n');

        console.log('📌 SCHOOL 1 ADMIN (I-Soft College Jhang):');
        console.log('   URL: /login');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('   School: I-Soft College Jhang (SCH-001)');
        console.log('   Students: 10');
        console.log('   Classes: 1-10 (Sections: A, B, C)\n');

        console.log('📌 SCHOOL 2 ADMIN (Green Valley School):');
        console.log('   URL: /login');
        console.log('   Username: greenadmin');
        console.log('   Password: admin123');
        console.log('   School: Green Valley School (SCH-002)');
        console.log('   Students: 5');
        console.log('   Classes: 1-8 (Sections: A, B)\n');

        console.log('='.repeat(70));
        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. Test Super Admin login');
        console.log('   2. Test School Admin logins');
        console.log('   3. Verify tenant isolation (each admin sees only their school)');
        console.log('   4. Test impersonation feature');
        console.log('   5. Build Super Admin frontend dashboard');
        console.log('\n' + '='.repeat(70));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Seeding Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seedDatabase();
