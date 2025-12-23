const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const School = require('../models/School');
const multer = require('multer');

// Simple memory storage for base64 conversion
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Get School Details
// @route   GET /api/school
router.get('/', protect, async (req, res) => {
    try {
        const school = await School.findById(req.tenant_id);
        if (!school) return res.status(404).json({ message: 'School not found' });
        res.json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update School Details
// @route   PUT /api/school
// Simple base64 upload - no external services needed
router.put('/', protect, upload.single('logo'), async (req, res) => {
    try {
        console.log('=== SCHOOL UPDATE DEBUG ===');
        console.log('Body:', req.body);
        console.log('File:', req.file ? 'File uploaded' : 'No file');
        console.log('User school_id:', req.tenant_id);

        // Prepare update data
        const updateData = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.address !== undefined) updateData.address = req.body.address;
        if (req.body.phone !== undefined) updateData.phone = req.body.phone;
        if (req.body.email !== undefined) updateData.email = req.body.email;

        // Convert uploaded file to base64 if present
        if (req.file) {
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            updateData.logo = base64Image;
            console.log('Logo converted to base64, size:', base64Image.length);
        }

        console.log('Update data:', { ...updateData, logo: updateData.logo ? 'base64 image' : undefined });

        // Use findOneAndUpdate with upsert to create if doesn't exist
        const school = await School.findOneAndUpdate(
            { _id: req.tenant_id },
            { $set: updateData },
            {
                new: true, // Return updated document
                upsert: true, // Create if doesn't exist
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        console.log('Updated/Created school successfully');
        res.json(school);
    } catch (error) {
        console.error('Error updating school:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: error.message,
            details: error.toString()
        });
    }
});

module.exports = router;
