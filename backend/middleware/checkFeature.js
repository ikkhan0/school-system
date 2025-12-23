// Middleware to check if tenant has a specific feature enabled

const checkFeature = (feature) => {
    return async (req, res, next) => {
        try {
            // Super admin bypasses feature checks
            if (req.user && req.user.role === 'super_admin') {
                return next();
            }

            // Core feature is always available
            if (feature === 'core') {
                return next();
            }

            // Check if tenant has the feature
            if (!req.tenant) {
                return res.status(403).json({
                    message: 'Tenant context not found'
                });
            }

            if (!req.tenant.hasFeature(feature)) {
                return res.status(403).json({
                    message: `Feature '${feature}' is not enabled for your school. Please upgrade your subscription.`,
                    feature: feature,
                    upgrade_required: true
                });
            }

            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ message: 'Server error in feature check' });
        }
    };
};

module.exports = checkFeature;
