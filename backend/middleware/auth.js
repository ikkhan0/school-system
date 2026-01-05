const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

            // IMPORTANT: For impersonation, trust the tenant_id from the JWT token first
            // This ensures that when super admin impersonates, we use the correct tenant context
            const tenantId = decoded.tenant_id || decoded.school_id;

            // Get user from the token
            // For impersonated sessions, the user might be from a different tenant
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Set tenant_id from JWT token (for impersonation) or fall back to user's tenant_id
            // Priority: JWT token > user object > user's school_id
            req.tenant_id = tenantId || req.user.tenant_id || req.user.school_id;
            req.school_id = decoded.school_id || req.user.school_id;

            // Add impersonation flag if present in token
            req.impersonated = decoded.impersonated_by ? true : false;
            req.impersonated_by = decoded.impersonated_by;

            next();
        } catch (error) {
            console.error('Auth error:', error);
            res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
