const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const School = require('../models/School'); // Ensure School model is registered
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const validUser = await User.findOne({ username })
            .populate('school_id')
            .populate('tenant_id');

        if (validUser && (await bcrypt.compare(password, validUser.password))) {

            // Check if user is active
            if (!validUser.is_active) {
                return res.status(403).json({ message: 'Account is deactivated' });
            }

            // Get school info from tenant (preferred) or fallback to old school_id
            const schoolId = validUser.school_id ? validUser.school_id._id : null;
            const tenantId = validUser.tenant_id ? validUser.tenant_id._id : null;

            // Use tenant school name if available, otherwise fallback to old school name
            let schoolName = 'Unknown School';
            if (validUser.tenant_id && validUser.tenant_id.school_name) {
                schoolName = validUser.tenant_id.school_name;
            } else if (validUser.school_id && validUser.school_id.school_name) {
                schoolName = validUser.school_id.school_name;
            }

            if (!schoolId && !tenantId) {
                console.warn(`Warning: User ${username} has no linked School or Tenant.`);
            }

            // Generate JWT with tenant context
            const token = jwt.sign(
                {
                    id: validUser._id,
                    role: validUser.role,
                    tenant_id: tenantId,
                    school_id: schoolId
                },
                process.env.JWT_SECRET || 'secret123',
                { expiresIn: '30d' }
            );

            res.json({
                _id: validUser._id,
                username: validUser.username,
                full_name: validUser.full_name,
                email: validUser.email,
                role: validUser.role,
                school_id: schoolId,
                school_name: schoolName,
                tenant_id: tenantId,
                permissions: validUser.permissions || [],
                token: token,
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
router.get('/me', async (req, res) => {
    // Should be protected
    // Simplified for now, relies on middleware in main index.js route def
    res.json({ message: 'User data' });
});

module.exports = router;
