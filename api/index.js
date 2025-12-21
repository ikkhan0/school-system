// Vercel Serverless Function Wrapper
try {
    const app = require('../backend/index');

    module.exports = async (req, res) => {
        try {
            return app(req, res);
        } catch (handlerError) {
            console.error('REQUEST HANDLER ERROR:', handlerError);
            return res.status(500).json({
                error: 'Request Handler Failed',
                message: handlerError.message,
                stack: process.env.NODE_ENV === 'development' ? handlerError.stack : undefined
            });
        }
    };
} catch (error) {
    console.error('CRITICAL STARTUP ERROR:', error);
    module.exports = (req, res) => {
        res.status(500).json({
            error: 'Server Startup Failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            type: error.name
        });
    };
}
