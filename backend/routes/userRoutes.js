const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users in the school (tenant)
// @route   GET /api/users
router.get('/', protect, async (req, res) => {
    try {
        const users = await User.find({
            tenant_id: req.tenant_id,
            role: { $ne: 'super_admin' } // Exclude super admins
        }).select('-password').sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create a new user
// @route   POST /api/users
router.post('/', protect, async (req, res) => {
    try {
        const { username, password, full_name, email, role, permissions } = req.body;

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            username,
            password: hashedPassword,
            full_name,
            email,
            role: role || 'teacher',
            permissions: permissions || [],
            tenant_id: req.tenant_id,
            school_id: req.user.school_id, // For backward compatibility
            is_active: true
        });

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update user
// @route   PATCH /api/users/:id
router.patch('/:id', protect, async (req, res) => {
    try {
        const { full_name, email, role, is_active } = req.body;

        const targetUser = await User.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // SECURITY CHECK: Only admins can edit users
        if (req.user.role !== 'super_admin' && req.user.role !== 'school_admin') {
            return res.status(403).json({
                message: 'Only administrators can edit user accounts'
            });
        }

        // SECURITY CHECK: school_admin cannot edit other admins
        const roleHierarchy = {
            'super_admin': 1,
            'school_admin': 2,
            'teacher': 3,
            'accountant': 3,
            'cashier': 3,
            'receptionist': 3,
            'librarian': 3,
            'transport_manager': 3
        };

        const requesterLevel = roleHierarchy[req.user.role] || 99;
        const targetLevel = roleHierarchy[targetUser.role] || 99;

        // school_admin cannot edit users of equal or higher privilege
        if (req.user.role === 'school_admin' && targetLevel <= requesterLevel) {
            return res.status(403).json({
                message: 'Cannot edit administrators or users of equal privilege level'
            });
        }

        // Update user fields
        if (full_name) targetUser.full_name = full_name;
        if (email) targetUser.email = email;
        if (role) targetUser.role = role;
        if (typeof is_active !== 'undefined') targetUser.is_active = is_active;

        await targetUser.save();

        // Return user without password
        const userResponse = targetUser.toObject();
        delete userResponse.password;

        res.json(userResponse);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update user permissions
// @route   PATCH /api/users/:id/permissions
router.patch('/:id/permissions', protect, async (req, res) => {
    try {
        const { permissions } = req.body;

        const user = await User.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update permissions
        user.permissions = permissions;
        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json(userResponse);
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Reset user password
// @route   PATCH /api/users/:id/password
router.patch('/:id/password', protect, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const targetUser = await User.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // SECURITY CHECK: Prevent privilege escalation
        // Define role hierarchy (lower number = higher privilege)
        const roleHierarchy = {
            'super_admin': 1,
            'school_admin': 2,
            'teacher': 3,
            'accountant': 3,
            'cashier': 3,
            'receptionist': 3,
            'librarian': 3,
            'transport_manager': 3
        };

        const requesterLevel = roleHierarchy[req.user.role] || 99;
        const targetLevel = roleHierarchy[targetUser.role] || 99;

        // Only super_admin and school_admin can reset passwords
        if (req.user.role !== 'super_admin' && req.user.role !== 'school_admin') {
            return res.status(403).json({
                message: 'Only administrators can reset user passwords'
            });
        }

        // Cannot reset password for higher or equal privilege level
        // Exception: super_admin can reset anyone's password
        if (req.user.role !== 'super_admin' && targetLevel <= requesterLevel) {
            return res.status(403).json({
                message: 'Cannot reset password for administrators or users of equal privilege level'
            });
        }

        // Hash and update password
        targetUser.password = await bcrypt.hash(password, 10);
        await targetUser.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const targetUser = await User.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // SECURITY CHECK: Only admins can delete users
        if (req.user.role !== 'super_admin' && req.user.role !== 'school_admin') {
            return res.status(403).json({
                message: 'Only administrators can delete user accounts'
            });
        }

        // SECURITY CHECK: Cannot delete your own account
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(403).json({
                message: 'Cannot delete your own account'
            });
        }

        // SECURITY CHECK: school_admin cannot delete other admins
        const roleHierarchy = {
            'super_admin': 1,
            'school_admin': 2,
            'teacher': 3,
            'accountant': 3,
            'cashier': 3
        };

        const requesterLevel = roleHierarchy[req.user.role] || 99;
        const targetLevel = roleHierarchy[targetUser.role] || 99;

        if (req.user.role === 'school_admin' && targetLevel <= requesterLevel) {
            return res.status(403).json({
                message: 'Cannot delete administrators or users of equal privilege level'
            });
        }

        await User.deleteOne({ _id: req.params.id });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ========== USER SELF-SERVICE ENDPOINTS ==========

// @desc    Get current user's profile
// @route   GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update current user's own profile
// @route   PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { full_name, email, preferred_language } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update only allowed  fields
        if (full_name !== undefined) user.full_name = full_name;
        if (email !== undefined) user.email = email;
        if (preferred_language !== undefined) user.preferred_language = preferred_language;

        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            message: 'Profile updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Change current user's own password
// @route   POST /api/users/change-password
router.post('/change-password', protect, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify oldPassword
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash and update password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
