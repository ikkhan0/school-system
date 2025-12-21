const http = require('http');

const testEndpoint = (path) => {
    console.log(`Testing ${path}...`);
    http.get(`http://localhost:5000${path}`, (res) => {
        console.log(`${path} status: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => console.log(`${path} body length:`, data.length));
    }).on('error', (err) => console.error(`${path} error:`, err.message));
};

testEndpoint('/api/dashboard/absents');
testEndpoint('/api/dashboard/warnings');
