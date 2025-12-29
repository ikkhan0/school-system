// Test the test-env endpoint
const axios = require('axios');

async function testEnv() {
    try {
        console.log('🧪 Testing /api/test-env endpoint...\n');

        const response = await axios.get('https://soft-school-management.vercel.app/api/test-env');

        console.log('✅ Response:\n');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Failed\n');
        console.error('Status:', error.response?.status);
        console.error('Error:', JSON.stringify(error.response?.data, null, 2));
    }
}

testEnv();
