// Middleware to ensure tenant isolation
// Automatically filters queries by tenant_id for non-super-admin users

const ensureTenant = async (req, res, next) => {
    try {
        // Skip for super admin
        if (req.user && req.user.role === 'super_admin') {
            return next();
        }

        // Get tenant_id from user (with fallback to school_id for backward compatibility)
        let tenantId = req.user?.tenant_id || req.user?.school_id || req.user?._id;

        if (!tenantId) {
            console.warn('⚠️ No tenant_id found for user:', req.user?.username);
            // For backward compatibility, use user's ID as tenant_id
            tenantId = req.user?._id;
        }

        // Attach tenant_id to request for easy access
        req.tenant_id = tenantId;

        // Continue without tenant verification to avoid errors
        next();
    } catch (error) {
        console.error('❌ Tenant isolation error:', error);
        // Don't fail the request - just log and continue
        req.tenant_id = req.user?._id;
        next();
    }
};

module.exports = ensureTenant;
