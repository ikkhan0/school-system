// Check if user permissions are saved correctly
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkUserPermissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('✅ Connected to MongoDB\n');

        // Find the teacher user you just created
        const teacher = await User.findOne({ username: 'imran' }); // Change to your teacher username

        if (!teacher) {
            console.log('❌ Teacher user not found');
            return;
        }

        console.log('='.repeat(70));
        console.log('USER PERMISSIONS CHECK');
        console.log('='.repeat(70));
        console.log('');
        console.log('Username:', teacher.username);
        console.log('Full Name:', teacher.full_name);
        console.log('Role:', teacher.role);
        console.log('Tenant ID:', teacher.tenant_id);
        console.log('');
        console.log('Permissions (' + teacher.permissions.length + '):');
        teacher.permissions.forEach((perm, index) => {
            console.log(`  ${index + 1}. ${perm}`);
        });
        console.log('');
        console.log('='.repeat(70));
        console.log('PERMISSION CHECKS');
        console.log('='.repeat(70));
        console.log('');
        console.log('Can view students?', teacher.hasPermission('students.view') ? '✅ YES' : '❌ NO');
        console.log('Can delete students?', teacher.hasPermission('students.delete') ? '✅ YES' : '❌ NO');
        console.log('Can collect fees?', teacher.hasPermission('fees.collect') ? '✅ YES' : '❌ NO');
        console.log('Can mark attendance?', teacher.hasPermission('attendance.mark') ? '✅ YES' : '❌ NO');
        console.log('');
        console.log('='.repeat(70));
        console.log('CONCLUSION');
        console.log('='.repeat(70));
        console.log('');
        if (teacher.permissions.length > 0) {
            console.log('✅ Permissions ARE saved in database');
            console.log('⚠️  BUT routes are not checking permissions yet');
            console.log('');
            console.log('Next step: Apply checkPermission middleware to routes');
        } else {
            console.log('❌ No permissions found - something went wrong');
        }
        console.log('');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.disconnect();
    }
}

checkUserPermissions();
