// Check Vercel health endpoint
const axios = require('axios');

async function checkHealth() {
    try {
        console.log('🔍 Checking Vercel Health...\n');

        const response = await axios.get('https://soft-school-management.vercel.app/api/health');

        console.log('✅ Health Check Response:\n');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Health Check Failed\n');
        console.error('Status:', error.response?.status);
        console.error('Error:', JSON.stringify(error.response?.data, null, 2));
    }
}

checkHealth();
