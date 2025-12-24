// Middleware to ensure tenant isolation
// Automatically filters queries by tenant_id for non-super-admin users

const Tenant = require('../models/Tenant');

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

        // Try to verify tenant exists (optional - don't fail if not found)
        try {
            const tenant = await Tenant.findById(tenantId);
            if (tenant) {
                req.tenant = tenant;

                // Check if tenant subscription is active (warning only)
                if (!tenant.isSubscriptionValid) {
                    console.warn('⚠️ Tenant subscription is inactive:', tenantId);
                }
            } else {
                console.warn('⚠️ Tenant not found, using fallback tenant_id:', tenantId);
            }
        } catch (tenantError) {
            // Tenant model might not exist or other error - continue anyway
            console.warn('⚠️ Could not verify tenant:', tenantError.message);
        }

        next();
    } catch (error) {
        console.error('❌ Tenant isolation error:', error);
        // Don't fail the request - just log and continue
        req.tenant_id = req.user?._id;
        next();
    }
};

module.exports = ensureTenant;
