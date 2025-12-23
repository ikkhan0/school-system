// Simple user creation test - Update credentials as needed
const axios = require('axios');

const API_URL = 'http://localhost:5000';

// UPDATE THESE WITH YOUR ACTUAL CREDENTIALS
const USERNAME = 'admin';  // Change this to your actual username
const PASSWORD = 'your_password_here';  // Change this to your actual password

async function testUserCreation() {
    console.log('='.repeat(70));
    console.log('USER CREATION DEBUG TEST');
    console.log('='.repeat(70));
    console.log('');

    try {
        console.log('Step 1: Login as school admin');
        console.log(`  Username: ${USERNAME}`);
        console.log(`  Password: ${PASSWORD.replace(/./g, '*')}`);

        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            username: USERNAME,
            password: PASSWORD
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data;

        console.log('  ✅ Login successful');
        console.log(`  User ID: ${user._id}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  School: ${user.school_name}`);
        console.log(`  Tenant ID: ${user.tenant_id || 'NOT SET'}`);
        console.log('');

        console.log('Step 2: Test GET /api/users');
        try {
            const usersResponse = await axios.get(`${API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`  ✅ Success - Found ${usersResponse.data.length} users`);
        } catch (err) {
            console.log(`  ❌ Failed: ${err.response?.data?.message || err.message}`);
            console.log(`  Status: ${err.response?.status}`);
        }
        console.log('');

        console.log('Step 3: Test POST /api/users (Create User)');
        try {
            const createResponse = await axios.post(`${API_URL}/api/users`, {
                username: 'testteacher' + Date.now(), // Unique username
                password: 'test123',
                full_name: 'Test Teacher',
                email: 'test@test.com',
                role: 'teacher',
                permissions: ['students.view', 'attendance.mark']
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('  ✅ User created successfully!');
            console.log(`  User ID: ${createResponse.data._id}`);
            console.log(`  Username: ${createResponse.data.username}`);
            console.log(`  Role: ${createResponse.data.role}`);
            console.log(`  Tenant ID: ${createResponse.data.tenant_id || 'NOT SET'}`);
            console.log(`  Permissions: ${createResponse.data.permissions?.length || 0}`);
        } catch (err) {
            console.log('  ❌ User creation FAILED');
            console.log(`  Status: ${err.response?.status}`);
            console.log(`  Error: ${err.response?.data?.message || err.message}`);
            console.log('  Full error:', JSON.stringify(err.response?.data, null, 2));
        }
        console.log('');

        console.log('='.repeat(70));
        console.log('TEST COMPLETE');
        console.log('='.repeat(70));

    } catch (error) {
        console.log('');
        console.log('❌ FATAL ERROR');
        console.log(`Status: ${error.response?.status}`);
        console.log(`Message: ${error.response?.data?.message || error.message}`);
        console.log('');
        console.log('Full error:', error.response?.data);
    }
}

console.log('');
console.log('⚠️  UPDATE THE CREDENTIALS IN THIS FILE FIRST!');
console.log('   Edit test-user-creation.js and set your actual username/password');
console.log('');

testUserCreation();
