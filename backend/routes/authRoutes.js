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
        const validUser = await User.findOne({ username }).populate('school_id');

        if (validUser && (await bcrypt.compare(password, validUser.password))) {

            // Safety check for missing school reference
            const schoolId = validUser.school_id ? validUser.school_id._id : null;
            const schoolName = validUser.school_id ? validUser.school_id.name : 'Unknown School';

            if (!schoolId) {
                console.warn(`Warning: User ${username} has no linked School.`);
            }

            res.json({
                _id: validUser._id,
                username: validUser.username,
                role: validUser.role,
                school_id: schoolId,
                school_name: schoolName,
                token: generateToken(validUser._id),
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
