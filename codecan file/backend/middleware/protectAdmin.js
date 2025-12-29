const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');

/**
 * Auth middleware that supports both regular users AND Super Admin
 * Used for admin endpoints that Super Admin needs to access
 */
const protectAdmin = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

            // Try to find Super Admin first
            const superAdmin = await SuperAdmin.findById(decoded.id).select('-password');

            if (superAdmin) {
                req.user = superAdmin;
                req.user.role = 'Super Admin';
                req.isSuperAdmin = true;
                return next();
            }

            // If not Super Admin, try regular User
            const user = await User.findById(decoded.id).select('-password');

            if (user) {
                req.user = user;
                req.tenant_id = decoded.tenant_id || user.tenant_id || user.school_id;
                req.school_id = decoded.school_id || user.school_id;

                // Only allow Super Admin for admin routes
                if (user.role !== 'Super Admin') {
                    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
                }

                return next();
            }

            // No user found
            return res.status(401).json({ message: 'User not found' });

        } catch (error) {
            console.error('Auth error:', error);
            return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protectAdmin };
