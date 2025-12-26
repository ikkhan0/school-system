// Middleware to ensure tenant isolation
// Automatically filters queries by tenant_id for non-super-admin users

const ensureTenant = async (req, res, next) => {
    try {
        // Check for super_admin but DO NOT SKIP logic completely
        // If super_admin, they might need a tenant context. 
        // For now, if role is super_admin and no tenant_id found, we default to user._id to prevent crashes

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

        // Debug
        // console.log(`Tenant Context: ${req.user?.username} (${req.user?.role}) -> ${req.tenant_id}`);

        next();
    } catch (error) {
        console.error('❌ Tenant isolation error:', error);
        req.tenant_id = req.user?._id;
        next();
    }
};

module.exports = ensureTenant;
