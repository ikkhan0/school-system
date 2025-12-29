const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

let cachedConn = null;

const connectDB = async () => {
    if (cachedConn && mongoose.connection.readyState === 1) {
        return cachedConn;
    }

    // Hardcoded Fallback for Vercel Deployment
    const manual_uri = "mongodb+srv://imran_db_user:Imran321123@school.ubwky7x.mongodb.net/school_db?retryWrites=true&w=majority&appName=school";

    // Check if URI is valid (i.e., user has replaced the placeholder)
    const isManualConfigured = !manual_uri.includes("YOUR_PASSWORD_HERE");
    const final_uri = process.env.MONGO_URI || (isManualConfigured ? manual_uri : null);

    // ONLY throw error if NO valid URI is available
    if (!final_uri) {
        const errorMsg = 'FATAL: No valid MONGO_URI found. Please set MONGO_URI environment variable or configure manual_uri in db.js';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    console.log('Attempting MongoDB connection...');
    console.log('Using URI source:', process.env.MONGO_URI ? 'Environment Variable' : 'Hardcoded Fallback');

    try {
        const conn = await mongoose.connect(final_uri, {
            serverSelectionTimeoutMS: 30000, // 30 seconds for initial connection
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        cachedConn = conn;
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('Full error:', error);
        cachedConn = null; // Clear cache on error
        throw error;
    }
};

module.exports = connectDB;
