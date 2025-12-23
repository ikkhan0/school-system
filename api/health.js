// Vercel Serverless Function Health Check
// This will help diagnose what's wrong with the deployment

module.exports = async (req, res) => {
    try {
        // Check environment variables
        const envCheck = {
            MONGO_URI: process.env.MONGO_URI ? '✅ Set' : '❌ Missing',
            JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
            PORT: process.env.PORT || 'Not set (using default)',
            NODE_ENV: process.env.NODE_ENV || 'Not set'
        };

        // Check MongoDB connection
        let mongoStatus = 'Not tested';
        try {
            const mongoose = require('mongoose');
            if (process.env.MONGO_URI) {
                await mongoose.connect(process.env.MONGO_URI, {
                    serverSelectionTimeoutMS: 5000
                });
                mongoStatus = '✅ Connected';
                await mongoose.disconnect();
            } else {
                mongoStatus = '❌ MONGO_URI not set';
            }
        } catch (error) {
            mongoStatus = `❌ Failed: ${error.message}`;
        }

        res.status(200).json({
            status: 'Vercel Health Check',
            timestamp: new Date().toISOString(),
            environment: {
                variables: envCheck,
                mongoConnection: mongoStatus
            },
            nodeVersion: process.version,
            platform: process.platform
        });

    } catch (error) {
        res.status(500).json({
            error: 'Health check failed',
            message: error.message,
            stack: error.stack
        });
    }
};
