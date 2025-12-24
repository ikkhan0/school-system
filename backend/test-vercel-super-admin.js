// Test Super Admin Login on Vercel
const axios = require('axios');

async function testSuperAdminLogin() {
    try {
        console.log('🧪 Testing Super Admin Login on Vercel...\n');

        const response = await axios.post('https://soft-school-management.vercel.app/api/super-admin/login', {
            email: 'admin@school.com',
            password: 'admin123'
        });

        console.log('✅ Login Successful!');
        console.log('\nToken:', response.data.token);
        console.log('\nUser:', JSON.stringify(response.data.user, null, 2));

    } catch (error) {
        console.error('❌ Login Failed\n');
        console.error('Status:', error.response?.status);
        console.error('Error:', JSON.stringify(error.response?.data, null, 2));
        console.error('\nFull Error:', error.message);
    }
}

testSuperAdminLogin();
