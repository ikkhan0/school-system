// Debugging Wrapper to catch startup errors
try {
    const app = require('../backend/index');

    module.exports = (req, res) => {
        app(req, res);
    };
} catch (error) {
    console.error('CRITICAL STRUP ERROR:', error);
    module.exports = (req, res) => {
        res.status(500).json({
            error: 'Server Startup Failed',
            message: error.message,
            stack: error.stack,
            type: error.name
        });
    };
}
