// Test if ANY route works
const axios = require('axios');

async function testRoutes() {
    console.log('Testing different endpoints...\n');

    // Test 1: Root
    try {
        const res1 = await axios.get('http://localhost:5000/');
        console.log('✅ Root (/) works:', res1.status);
    } catch (e) {
        console.log('❌ Root (/) failed:', e.message);
    }

    // Test 2: Auth route (should work)
    try {
        const res2 = await axios.post('http://localhost:5000/api/auth/login', {});
        console.log('✅ Auth route works:', res2.status);
    } catch (e) {
        console.log('Status:', e.response?.status, '- Auth route exists but expects data');
    }

    // Test 3: Super admin route
    try {
        const res3 = await axios.post('http://localhost:5000/api/super-admin/login', {});
        console.log('✅ Super admin route works:', res3.status);
    } catch (e) {
        if (e.response?.status === 404) {
            console.log('❌ Super admin route NOT FOUND (404)');
        } else {
            console.log('Status:', e.response?.status, '- Super admin route exists but expects data');
        }
    }
}

testRoutes();
