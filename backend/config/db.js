const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

let cachedConn = null;

const connectDB = async () => {
    if (cachedConn) return cachedConn;

    if (!process.env.MONGO_URI) {
        console.error('FATAL: MONGO_URI environment variable is not defined.');
        if (process.env.NODE_ENV === 'production') {
            console.warn('WARN: MONGO_URI is missing. Skipping connection to prevent crash.');
            return;
        }
    }
}

try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_db', {
        serverSelectionTimeoutMS: 5000 // Fail fast if no ID
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    cachedConn = conn;
    return conn;
} catch (error) {
    console.error(`Error: ${error.message}`);
    // Do not exit process in serverless, just throw
    throw error;
}
};

module.exports = connectDB;
