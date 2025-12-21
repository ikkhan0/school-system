const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

let cachedConn = null;

const connectDB = async () => {
    if (cachedConn) return cachedConn;

    // Hardcoded Fallback for Vercel Deployment (User Requested Implementation)
    // Replace 'YOUR_PASSWORD_HERE' with your actual password
    const manual_uri = "mongodb+srv://imran_db_user:Imran321123@school.ubwky7x.mongodb.net/?appName=school";

    // Check if URI is valid (i.e., user has replaced the placeholder)
    const isManualConfigured = manual_uri.includes("YOUR_PASSWORD_HERE") === false;

    // ONLY return early if BOTH env var AND manual config are missing
    if (!process.env.MONGO_URI && !isManualConfigured) {
        console.error('FATAL: MONGO_URI environment variable is not defined.');
        if (process.env.NODE_ENV === 'production') {
            console.warn('WARN: MONGO_URI is missing. Skipping connection to prevent crash.');
            return;
        }
    }



    const final_uri = process.env.MONGO_URI || (isManualConfigured ? manual_uri : null) || 'mongodb://localhost:27017/school_db';

    try {
        const conn = await mongoose.connect(final_uri, {
            serverSelectionTimeoutMS: 5000
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
