// Direct test of Vercel API endpoints
const axios = require('axios');

async function testVercelEndpoints() {
    console.log('🔍 Testing Vercel Deployment...\n');
    console.log('='.repeat(60));

    // Test 1: Health endpoint
    try {
        console.log('\n1️⃣ Testing /api/health endpoint...');
        const health = await axios.get('https://soft-school-management.vercel.app/api/health');
        console.log('✅ Health endpoint works!');
        console.log('Response:', JSON.stringify(health.data, null, 2));
    } catch (error) {
        console.log('❌ Health endpoint failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
    }

    // Test 2: Super Admin login
    try {
        console.log('\n2️⃣ Testing /api/super-admin/login endpoint...');
        const login = await axios.post('https://soft-school-management.vercel.app/api/super-admin/login', {
            email: 'admin@school.com',
            password: 'admin123'
        });
        console.log('✅ Super Admin login works!');
        console.log('Token received:', login.data.token ? 'Yes' : 'No');
    } catch (error) {
        console.log('❌ Super Admin login failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
        console.log('Message:', error.message);
    }

    // Test 3: Regular login (for comparison)
    try {
        console.log('\n3️⃣ Testing /api/auth/login endpoint (regular login)...');
        const regularLogin = await axios.post('https://soft-school-management.vercel.app/api/auth/login', {
            username: 'test',
            password: 'test'
        });
        console.log('✅ Regular login endpoint works!');
    } catch (error) {
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 DIAGNOSIS:\n');
    console.log('If all endpoints show 500 errors:');
    console.log('  → Environment variables are NOT set on Vercel');
    console.log('  → Go to Vercel Settings → Environment Variables');
    console.log('  → Make sure "Production" is checked for all variables\n');
    console.log('If only Super Admin login fails:');
    console.log('  → Super Admin account might not exist in database');
    console.log('  → Or password is incorrect\n');
    console.log('='.repeat(60));
}

testVercelEndpoints();
