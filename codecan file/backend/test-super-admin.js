// Quick test script to register Super Admin via API
const axios = require('axios');

async function registerSuperAdmin() {
    try {
        console.log('🔐 Registering Super Admin...\n');

        const response = await axios.post('http://localhost:5000/api/super-admin/register', {
            name: 'Super Administrator',
            email: 'admin@isoft.com',
            password: 'admin123'
        });

        console.log('✅ SUCCESS! Super Admin registered\n');
        console.log('Token:', response.data.token.substring(0, 50) + '...');
        console.log('\n📋 Login Credentials:');
        console.log('   Email: admin@isoft.com');
        console.log('   Password: admin123');
        console.log('\n🎯 Now try logging in at: http://localhost:3000/super-admin/login\n');

    } catch (error) {
        if (error.response?.status === 400) {
            console.log('⚠️  Super Admin already exists. Try logging in instead.');
            console.log('\n📋 Login Credentials:');
            console.log('   Email: admin@isoft.com');
            console.log('   Password: admin123');
        } else {
            console.error('❌ Error:', error.response?.data || error.message);
        }
    }
}

registerSuperAdmin();
