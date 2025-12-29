// Test super admin login locally
const axios = require('axios');

async function testSuperAdminLogin() {
    try {
        console.log('Testing Super Admin Login...\n');

        const response = await axios.post('http://localhost:5000/api/super-admin/login', {
            email: 'admin@school.com',
            password: 'admin123'
        });

        console.log('✅ Login Successful!');
        console.log('Token:', response.data.token);
        console.log('User:', response.data);

    } catch (error) {
        console.error('❌ Login Failed');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data);
    }
}

testSuperAdminLogin();
