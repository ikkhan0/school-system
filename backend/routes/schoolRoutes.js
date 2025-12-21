const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const School = require('../models/School');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || 'demo',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'school-logos',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Get School Details
// @route   GET /api/school
router.get('/', protect, async (req, res) => {
    try {
        const school = await School.findById(req.user.school_id);
        if (!school) return res.status(404).json({ message: 'School not found' });
        res.json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update School Details
// @route   PUT /api/school
// Temporarily disabled logo upload - will fix Cloudinary separately
router.put('/', protect, async (req, res) => {
    try {
        console.log('=== SCHOOL UPDATE DEBUG ===');
        console.log('Body:', req.body);
        console.log('User school_id:', req.user.school_id);

        // Prepare update data (NO LOGO for now)
        const updateData = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.address !== undefined) updateData.address = req.body.address;
        if (req.body.phone !== undefined) updateData.phone = req.body.phone;
        if (req.body.email !== undefined) updateData.email = req.body.email;

        console.log('Update data:', updateData);

        // Use findOneAndUpdate with upsert to create if doesn't exist
        const school = await School.findOneAndUpdate(
            { _id: req.user.school_id },
            { $set: updateData },
            {
                new: true, // Return updated document
                upsert: true, // Create if doesn't exist
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        console.log('Updated/Created school:', school);
        res.json(school);
    } catch (error) {
        console.error('Error updating school:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error code:', error.code);
        res.status(500).json({
            message: error.message,
            name: error.name,
            code: error.code,
            details: error.toString()
        });
    }
});

module.exports = router;
