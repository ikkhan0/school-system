const AcademicSession = require('../models/AcademicSession');

/**
 * Middleware to extract and validate session context
 * Reads from header: x-session-id
 * Falls back to current session if not provided
 * OPTIONAL: Routes work even without session
 */
const sessionContext = async (req, res, next) => {
    try {
        let sessionId = req.headers['x-session-id'];

        // If no session provided, try to get current session
        if (!sessionId && req.tenant_id) {
            try {
                const currentSession = await AcademicSession.findOne({
                    tenant_id: req.tenant_id,
                    is_current: true
                }).lean();

                if (currentSession) {
                    sessionId = currentSession._id.toString();
                }
            } catch (err) {
                console.error('Error finding current session:', err.message);
                // Continue without session
            }
        }

        // Validate session exists and belongs to tenant
        if (sessionId && req.tenant_id) {
            try {
                const session = await AcademicSession.findOne({
                    _id: sessionId,
                    tenant_id: req.tenant_id
                }).lean();

                if (session) {
                    req.session_id = session._id;
                    req.session = session;
                }
            } catch (err) {
                console.error('Error validating session:', err.message);
                // Continue without session
            }
        }

        // Always continue - session is optional
        next();
    } catch (error) {
        console.error('Session context middleware error:', error);
        // Continue even if session context fails completely
        next();
    }
};

module.exports = sessionContext;
