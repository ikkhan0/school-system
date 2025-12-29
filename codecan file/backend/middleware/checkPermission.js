// Middleware to check if user has required permission

const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        try {
            // Super admin bypasses all permission checks
            if (req.user.role === 'super_admin') {
                return next();
            }

            // School admin has full access to their tenant
            if (req.user.role === 'school_admin') {
                return next();
            }

            // Check if user has the required permission
            if (req.user.hasPermission && req.user.hasPermission(requiredPermission)) {
                return next();
            }

            return res.status(403).json({
                message: `Insufficient permissions. Required: ${requiredPermission}`
            });
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Server error in permission check' });
        }
    };
};

module.exports = checkPermission;
