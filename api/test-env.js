// Simple test endpoint to check environment variables
module.exports = async (req, res) => {
    res.status(200).json({
        message: 'Environment Variable Test',
        timestamp: new Date().toISOString(),
        variables: {
            MONGO_URI: process.env.MONGO_URI ? `Set (${process.env.MONGO_URI.substring(0, 20)}...)` : 'NOT SET',
            JWT_SECRET: process.env.JWT_SECRET ? `Set (${process.env.JWT_SECRET.substring(0, 10)}...)` : 'NOT SET',
            PORT: process.env.PORT || 'NOT SET',
            NODE_ENV: process.env.NODE_ENV || 'NOT SET',
            ALL_ENV_KEYS: Object.keys(process.env).filter(k => !k.startsWith('VERCEL_')).join(', ')
        }
    });
};
