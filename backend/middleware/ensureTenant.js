// Middleware to ensure tenant isolation
// Automatically filters queries by tenant_id for non-super-admin users

const Tenant = require('../models/Tenant');

const ensureTenant = async (req, res, next) => {
    try {
        // Skip for super admin
        if (req.user && req.user.role === 'super_admin') {
            return next();
        }

        // Get tenant_id from user
        const tenantId = req.user?.tenant_id;

        if (!tenantId) {
            return res.status(403).json({
                message: 'No tenant context found. Please contact administrator.'
            });
        }

        // Verify tenant exists and is active
        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.status(403).json({
                message: 'Invalid tenant. Please contact administrator.'
            });
        }

        // Check if tenant subscription is active
        if (!tenant.isSubscriptionValid) {
            return res.status(403).json({
                message: 'School subscription is inactive. Please contact administrator to renew.'
            });
        }

        // Attach tenant info to request for easy access
        req.tenant = tenant;
        req.tenant_id = tenantId;

        next();
    } catch (error) {
        console.error('Tenant isolation error:', error);
        res.status(500).json({ message: 'Server error in tenant validation' });
    }
};

module.exports = ensureTenant;
