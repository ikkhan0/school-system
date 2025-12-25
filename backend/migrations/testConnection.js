const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('Testing MongoDB connection...');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGO_URI preview:', process.env.MONGO_URI?.substring(0, 30) + '...');

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB!');
        return mongoose.connection.close();
    })
    .then(() => {
        console.log('✅ Connection closed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Connection failed:');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    });
