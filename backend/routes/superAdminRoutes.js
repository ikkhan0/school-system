const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Test endpoint to verify routes are loaded
// @route   GET /api/super-admin/test
router.get('/test', (req, res) => {
    res.json({ message: 'Super Admin routes are working!', timestamp: new Date() });
});

// @desc    Super Admin Login (Auto-register if first time)
// @route   POST /api/super-admin/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if any super admin exists
        const superAdminCount = await SuperAdmin.countDocuments();

        // If no super admin exists, auto-register this as the first one
        if (superAdminCount === 0) {
            console.log('No super admin exists. Auto-registering first super admin...');

            // Hash password manually to avoid pre-save hook issues
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create first super admin using direct MongoDB insertion
            const db = require('mongoose').connection.db;
            await db.collection('superadmins').insertOne({
                name: 'Super Administrator',
                email: email,
                password: hashedPassword,
                role: 'super_admin',
                phone: '',
                is_active: true,
                permissions: ['*'],
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Fetch the newly created admin
            const newAdmin = await SuperAdmin.findOne({ email });

            // Generate JWT
            const token = jwt.sign(
                {
                    id: newAdmin._id,
                    role: 'super_admin',
                    email: newAdmin.email
                },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            return res.json({
                token,
                user: {
                    id: newAdmin._id,
                    name: newAdmin.name,
                    email: newAdmin.email,
                    role: 'super_admin'
                },
                message: 'First super admin created successfully!'
            });
        }

        // Find existing super admin
        const superAdmin = await SuperAdmin.findOne({ email });

        if (!superAdmin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if active
        if (!superAdmin.is_active) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Verify password
        const isMatch = await superAdmin.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        try {
            superAdmin.last_login = new Date();
            await superAdmin.save();
        } catch (saveError) {
            // If save fails, update directly via MongoDB
            console.warn('Save failed, updating via MongoDB directly:', saveError.message);
            await SuperAdmin.updateOne(
                { _id: superAdmin._id },
                { $set: { last_login: new Date() } }
            );
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: superAdmin._id,
                role: 'super_admin',
                email: superAdmin.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: 'super_admin'
            }
        });
    } catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create Super Admin (First time setup only)
// @route   POST /api/super-admin/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, secret_key } = req.body;

        // Check if this is first super admin
        const existingCount = await SuperAdmin.countDocuments();

        // Only allow registration if no super admins exist OR valid secret key
        if (existingCount > 0 && secret_key !== process.env.SUPER_ADMIN_SECRET) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if email already exists
        const existing = await SuperAdmin.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create super admin
        const superAdmin = await SuperAdmin.create({
            name,
            email,
            password
        });

        // Generate JWT
        const token = jwt.sign(
            {
                id: superAdmin._id,
                role: 'super_admin',
                email: superAdmin.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            token,
            user: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: 'super_admin'
            }
        });
    } catch (error) {
        console.error('Super admin registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Middleware to protect super admin routes
const protectSuperAdmin = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'super_admin') {
            return res.status(403).json({ message: 'Super admin access required' });
        }

        const superAdmin = await SuperAdmin.findById(decoded.id).select('-password');

        if (!superAdmin || !superAdmin.is_active) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        req.user = superAdmin;
        next();
    } catch (error) {
        console.error('Super admin auth error:', error);
        res.status(401).json({ message: 'Not authorized' });
    }
};

// @desc    Get all tenants (schools)
// @route   GET /api/super-admin/tenants
router.get('/tenants', protectSuperAdmin, async (req, res) => {
    try {
        const tenants = await Tenant.find()
            .sort({ createdAt: -1 })
            .select('-__v');

        // Get user count for each tenant
        const tenantsWithStats = await Promise.all(
            tenants.map(async (tenant) => {
                const userCount = await User.countDocuments({ tenant_id: tenant._id });
                return {
                    ...tenant.toObject(),
                    userCount
                };
            })
        );

        res.json(tenantsWithStats);
    } catch (error) {
        console.error('Get tenants error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create new tenant (school)
// @route   POST /api/super-admin/tenants
router.post('/tenants', protectSuperAdmin, async (req, res) => {
    try {
        const {
            school_name,
            contact_info,
            subscription_plan,
            features_enabled,
            admin_username,
            admin_password,
            admin_name,
            admin_email
        } = req.body;

        // Generate unique tenant_id
        const tenant_id = await Tenant.generateTenantId();

        // Create tenant
        const tenant = await Tenant.create({
            tenant_id,
            school_name,
            contact_info,
            subscription_plan: subscription_plan || 'Free',
            features_enabled: features_enabled || ['core'],
            subscription_status: 'Active',
            created_by: req.user._id
        });

        // Create first admin user for this tenant
        const hashedPassword = await bcrypt.hash(admin_password, 10);

        const adminUser = await User.create({
            username: admin_username,
            password: hashedPassword,
            full_name: admin_name,
            email: admin_email,
            role: 'school_admin',
            tenant_id: tenant._id,
            is_active: true,
            permissions: ['*']
        });

        res.status(201).json({
            tenant,
            adminUser: {
                id: adminUser._id,
                username: adminUser.username,
                email: adminUser.email,
                role: adminUser.role
            }
        });
    } catch (error) {
        console.error('Create tenant error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update tenant status
// @route   PATCH /api/super-admin/tenants/:id/status
router.patch('/tenants/:id/status', protectSuperAdmin, async (req, res) => {
    try {
        const { subscription_status } = req.body;

        const tenant = await Tenant.findByIdAndUpdate(
            req.params.id,
            { subscription_status },
            { new: true }
        );

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        res.json(tenant);
    } catch (error) {
        console.error('Update tenant status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update tenant features
// @route   PATCH /api/super-admin/tenants/:id/features
router.patch('/tenants/:id/features', protectSuperAdmin, async (req, res) => {
    try {
        const { features_enabled } = req.body;

        const tenant = await Tenant.findByIdAndUpdate(
            req.params.id,
            { features_enabled },
            { new: true }
        );

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        res.json(tenant);
    } catch (error) {
        console.error('Update tenant features error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Impersonate school admin (Login as)
// @route   POST /api/super-admin/impersonate/:tenantId
router.post('/impersonate/:tenantId', protectSuperAdmin, async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.tenantId);

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // Find the school admin for this tenant
        const adminUser = await User.findOne({
            tenant_id: tenant._id,
            role: 'school_admin'
        });

        if (!adminUser) {
            return res.status(404).json({ message: 'No admin user found for this tenant' });
        }

        // Generate temporary JWT for impersonation
        const token = jwt.sign(
            {
                id: adminUser._id,
                role: adminUser.role,
                tenant_id: adminUser.tenant_id,
                impersonated_by: req.user._id // Track who is impersonating
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // Shorter expiry for security
        );

        res.json({
            token,
            user: {
                id: adminUser._id,
                username: adminUser.username,
                full_name: adminUser.full_name,
                role: adminUser.role,
                tenant_id: adminUser.tenant_id,
                school_name: tenant.school_name,
                impersonated: true
            }
        });
    } catch (error) {
        console.error('Impersonate error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get dashboard stats
// @route   GET /api/super-admin/stats
router.get('/stats', protectSuperAdmin, async (req, res) => {
    try {
        const totalTenants = await Tenant.countDocuments();
        const activeTenants = await Tenant.countDocuments({ subscription_status: 'Active' });
        const inactiveTenants = await Tenant.countDocuments({ subscription_status: 'Inactive' });
        const trialTenants = await Tenant.countDocuments({ subscription_status: 'Trial' });

        res.json({
            totalTenants,
            activeTenants,
            inactiveTenants,
            trialTenants
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all users for a specific tenant
// @route   GET /api/super-admin/tenants/:tenantId/users
router.get('/tenants/:tenantId/users', protectSuperAdmin, async (req, res) => {
    try {
        const users = await User.find({ tenant_id: req.params.tenantId })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error('Get tenant users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Reset password for a specific user
// @route   PATCH /api/super-admin/users/:userId/password
router.patch('/users/:userId/password', protectSuperAdmin, async (req, res) => {
    try {
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password directly
        await User.updateOne(
            { _id: req.params.userId },
            { $set: { password: hashedPassword } }
        );

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get super admin profile
// @route   GET /api/super-admin/profile
router.get('/profile', protectSuperAdmin, async (req, res) => {
    try {
        const superAdmin = await SuperAdmin.findById(req.user._id).select('-password');

        if (!superAdmin) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json(superAdmin);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update super admin profile
// @route   PATCH /api/super-admin/profile
router.patch('/profile', protectSuperAdmin, async (req, res) => {
    try {
        const { name, email, phone, current_password, new_password } = req.body;

        const superAdmin = await SuperAdmin.findById(req.user._id);

        if (!superAdmin) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // If changing password, verify current password
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ message: 'Current password required' });
            }

            const isMatch = await superAdmin.matchPassword(current_password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            if (new_password.length < 6) {
                return res.status(400).json({ message: 'New password must be at least 6 characters' });
            }

            // Hash and update password
            const hashedPassword = await bcrypt.hash(new_password, 10);
            await SuperAdmin.updateOne(
                { _id: req.user._id },
                { $set: { password: hashedPassword } }
            );
        }

        // Update other fields
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;

        if (Object.keys(updateData).length > 0) {
            await SuperAdmin.updateOne(
                { _id: req.user._id },
                { $set: updateData }
            );
        }

        // Get updated profile
        const updatedProfile = await SuperAdmin.findById(req.user._id).select('-password');

        res.json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update tenant features
// @route   PATCH /api/super-admin/tenants/:id/features
router.patch('/tenants/:id/features', protectSuperAdmin, async (req, res) => {
    try {
        const { features_enabled } = req.body;

        const tenant = await Tenant.findById(req.params.id);

        if (!tenant) {
            return res.status(404).json({ message: 'School not found' });
        }

        // Update features
        tenant.features_enabled = features_enabled;
        await tenant.save();

        res.json({
            message: 'Features updated successfully',
            tenant
        });
    } catch (error) {
        console.error('Update features error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update tenant (school) information
// @route   PATCH /api/super-admin/tenants/:id
router.patch('/tenants/:id', protectSuperAdmin, async (req, res) => {
    try {
        const {
            school_name,
            contact_info,
            subscription_plan,
            features_enabled,
            logo,
            address,
            city,
            phone,
            email
        } = req.body;

        const tenant = await Tenant.findById(req.params.id);

        if (!tenant) {
            return res.status(404).json({ message: 'School not found' });
        }

        // Update fields
        if (school_name) tenant.school_name = school_name;
        if (subscription_plan) tenant.subscription_plan = subscription_plan;
        if (features_enabled) tenant.features_enabled = features_enabled;

        // Update contact info
        if (contact_info || phone || email || address || city) {
            tenant.contact_info = {
                ...tenant.contact_info,
                phone: phone || tenant.contact_info?.phone,
                email: email || tenant.contact_info?.email,
                address: address || tenant.contact_info?.address,
                city: city || tenant.contact_info?.city
            };
        }

        if (logo !== undefined) tenant.logo = logo;

        await tenant.save();

        res.json({
            message: 'School updated successfully',
            tenant
        });
    } catch (error) {
        console.error('Update tenant error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete tenant (school) and all associated data
// @route   DELETE /api/super-admin/tenants/:id
router.delete('/tenants/:id', protectSuperAdmin, async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);

        if (!tenant) {
            return res.status(404).json({ message: 'School not found' });
        }

        // Delete all associated data
        await User.deleteMany({ tenant_id: tenant._id });
        await Student.deleteMany({ tenant_id: tenant._id });

        // Delete other models if they exist
        try {
            const Class = require('../models/Class');
            await Class.deleteMany({ tenant_id: tenant._id });
        } catch (e) { }

        try {
            const Fee = require('../models/Fee');
            await Fee.deleteMany({ tenant_id: tenant._id });
        } catch (e) { }

        try {
            const Staff = require('../models/Staff');
            await Staff.deleteMany({ tenant_id: tenant._id });
        } catch (e) { }

        try {
            const Exam = require('../models/Exam');
            await Exam.deleteMany({ tenant_id: tenant._id });
        } catch (e) { }

        try {
            const Family = require('../models/Family');
            await Family.deleteMany({ tenant_id: tenant._id });
        } catch (e) { }

        try {
            const Subject = require('../models/Subject');
            await Subject.deleteMany({ tenant_id: tenant._id });
        } catch (e) { }

        // Finally delete the tenant
        await Tenant.findByIdAndDelete(req.params.id);

        res.json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('Delete tenant error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
