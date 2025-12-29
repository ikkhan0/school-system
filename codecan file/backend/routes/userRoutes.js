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

        const user = await User.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (full_name !== undefined) user.full_name = full_name;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;
        if (is_active !== undefined) user.is_active = is_active;

        await user.save();

        // Return user without password
        const userResponse = user.toObject();
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

        const user = await User.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash and update password
        user.password = await bcrypt.hash(password, 10);
        await user.save();

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
        const user = await User.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting school admin
        if (user.role === 'school_admin') {
            return res.status(403).json({ message: 'Cannot delete school admin user' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
