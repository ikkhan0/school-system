// Simple test to check if super admin exists and login works
const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing Super Admin Login...\n');

        const response = await axios.post('http://localhost:5000/api/super-admin/login', {
            email: 'admin@isoft.com.pk',
            password: 'admin123'
        });

        console.log('✅ LOGIN SUCCESSFUL!\n');
        console.log('User:', response.data.user);
        console.log('\nToken:', response.data.token.substring(0, 50) + '...');

        if (response.data.message) {
            console.log('\nMessage:', response.data.message);
        }

        console.log('\n🎯 You can now access the dashboard!');

    } catch (error) {
        console.error('❌ LOGIN FAILED');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message || error.message);
        console.error('\nFull error:', error.response?.data);
    }
}

testLogin();
