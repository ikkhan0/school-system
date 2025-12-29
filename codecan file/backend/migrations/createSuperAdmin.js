require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('✅ Connected to MongoDB\n');

        // Check if super admin already exists
        const existingCount = await SuperAdmin.countDocuments();

        if (existingCount > 0) {
            console.log('⚠️  Super Admin already exists!');
            const existing = await SuperAdmin.find().select('name email');
            console.log('\nExisting Super Admins:');
            existing.forEach((admin, i) => {
                console.log(`   ${i + 1}. ${admin.name} (${admin.email})`);
            });

            const proceed = await question('\nDo you want to create another Super Admin? (yes/no): ');
            if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
                console.log('\n❌ Cancelled');
                rl.close();
                await mongoose.disconnect();
                process.exit(0);
            }
        }

        console.log('🔐 Create Super Admin Account\n');
        console.log('This account will have full system access to manage all schools.\n');

        const name = await question('Enter name: ');
        const email = await question('Enter email: ');
        const password = await question('Enter password (min 6 characters): ');
        const confirmPassword = await question('Confirm password: ');

        if (password !== confirmPassword) {
            console.log('\n❌ Passwords do not match!');
            rl.close();
            await mongoose.disconnect();
            process.exit(1);
        }

        if (password.length < 6) {
            console.log('\n❌ Password must be at least 6 characters!');
            rl.close();
            await mongoose.disconnect();
            process.exit(1);
        }

        // Check if email already exists
        const existing = await SuperAdmin.findOne({ email });
        if (existing) {
            console.log('\n❌ Email already registered!');
            rl.close();
            await mongoose.disconnect();
            process.exit(1);
        }

        // Create super admin
        const superAdmin = await SuperAdmin.create({
            name,
            email,
            password
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ Super Admin Created Successfully!');
        console.log('='.repeat(60));
        console.log(`\nName: ${superAdmin.name}`);
        console.log(`Email: ${superAdmin.email}`);
        console.log(`Role: ${superAdmin.role}`);
        console.log('\n🎯 You can now login at: /super-admin/login');
        console.log('='.repeat(60));

        rl.close();
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        rl.close();
        await mongoose.disconnect();
        process.exit(1);
    }
}

createSuperAdmin();
