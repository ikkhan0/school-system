// Middleware to ensure tenant isolation
// Automatically filters queries by tenant_id for non-super-admin users

const ensureTenant = async (req, res, next) => {
    try {
        // If tenant_id is already set by auth middleware, skip
        if (req.tenant_id) {
            return next();
        }

        // Fallback logic if not set by auth middleware
        let tenantId = req.user?.tenant_id || req.user?.school_id || req.user?._id;

        // If explicitly super_admin, we can proceed, but models requiring tenant_id will need SOMETHING.
        if (req.user && req.user.role === 'super_admin') {
            // If super admin hasn't selected a tenant (via header/body - which we aren't handling yet),
            // use their own ID as a placeholder "System Tenant"
            if (!tenantId) tenantId = req.user._id;
        }

        if (!tenantId) {
            console.warn('⚠️ No tenant_id found for user:', req.user?.username);
            tenantId = req.user?._id;
        }

        req.tenant_id = tenantId;

        next();
    } catch (error) {
        console.error('❌ Tenant isolation error:', error);
        if (!req.tenant_id) {
            req.tenant_id = req.user?._id;
        }
        next();
    }
};

module.exports = ensureTenant;
