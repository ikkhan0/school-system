require('dotenv').config();
const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login for both schools...\n');

        // Test SCH-001
        console.log('='.repeat(60));
        console.log('Testing SCH-001 Login');
        console.log('='.repeat(60));

        try {
            const response1 = await axios.post('http://localhost:5000/api/auth/login', {
                username: 'admin',
                password: 'admin'
            });

            console.log('✅ Login successful!');
            console.log('User:', response1.data.full_name);
            console.log('Role:', response1.data.role);
            console.log('Tenant ID:', response1.data.tenant_id);
            console.log('School Name:', response1.data.school_name);
            console.log('Token:', response1.data.token.substring(0, 50) + '...');
        } catch (error) {
            console.log('❌ Login failed:', error.response?.data?.message || error.message);
        }

        console.log('\n');

        // Test SCH-002
        console.log('='.repeat(60));
        console.log('Testing SCH-002 Login');
        console.log('='.repeat(60));
        console.log('Note: Replace username/password with actual SCH-002 credentials');
        console.log('');

        // You'll need to update these with the actual SCH-002 credentials
        const sch002Username = 'admin'; // Update this
        const sch002Password = 'password123'; // Update this

        try {
            const response2 = await axios.post('http://localhost:5000/api/auth/login', {
                username: sch002Username,
                password: sch002Password
            });

            console.log('✅ Login successful!');
            console.log('User:', response2.data.full_name);
            console.log('Role:', response2.data.role);
            console.log('Tenant ID:', response2.data.tenant_id);
            console.log('School Name:', response2.data.school_name);
            console.log('Token:', response2.data.token.substring(0, 50) + '...');
        } catch (error) {
            console.log('❌ Login failed:', error.response?.data?.message || error.message);
        }

        console.log('\n');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();
