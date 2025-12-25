const AcademicSession = require('../models/AcademicSession');

/**
 * Middleware to extract and validate session context
 * Reads from header: x-session-id
 * Falls back to current session if not provided
 */
const sessionContext = async (req, res, next) => {
    try {
        let sessionId = req.headers['x-session-id'];

        // If no session provided, get current session
        if (!sessionId && req.tenant_id) {
            const currentSession = await AcademicSession.findOne({
                tenant_id: req.tenant_id,
                is_current: true
            });

            if (currentSession) {
                sessionId = currentSession._id.toString();
            }
        }

        // Validate session exists and belongs to tenant
        if (sessionId && req.tenant_id) {
            const session = await AcademicSession.findOne({
                _id: sessionId,
                tenant_id: req.tenant_id
            });

            if (session) {
                req.session_id = session._id;
                req.session = session;
            }
        }

        next();
    } catch (error) {
        console.error('Session context error:', error);
        next(); // Continue even if session context fails
    }
};

module.exports = sessionContext;
