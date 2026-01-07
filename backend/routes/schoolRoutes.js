const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const School = require('../models/School');
const multer = require('multer');
const { uploadToImgBB, deleteFromImgBB } = require('../config/imgbb');

// Memory storage for ImgBB upload (used for school logos - public is OK)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
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

        // Handle settings fields
        if (req.body.date_format || req.body.time_format || req.body.fee_voucher_note !== undefined) {
            updateData.settings = {};
            if (req.body.date_format) updateData.settings.date_format = req.body.date_format;
            if (req.body.time_format) updateData.settings.time_format = req.body.time_format;
            if (req.body.fee_voucher_note !== undefined) updateData.settings.fee_voucher_note = req.body.fee_voucher_note;
        }

        // Upload to ImgBB if file present
        if (req.file) {
            try {
                console.log('📤 Starting logo upload to ImgBB...');
                console.log('File size:', req.file.size, 'bytes');
                console.log('File mimetype:', req.file.mimetype);

                // Upload new logo to ImgBB
                const result = await uploadToImgBB(
                    req.file.buffer,
                    `school_${req.tenant_id}_logo`
                );

                updateData.logo = result.url;
                console.log('✅ Logo uploaded successfully to ImgBB:', result.url);
            } catch (uploadError) {
                console.error('❌ ImgBB upload error:', uploadError);
                console.error('Error details:', {
                    message: uploadError.message,
                    stack: uploadError.stack,
                    name: uploadError.name
                });
                return res.status(500).json({
                    message: 'Failed to upload logo to ImgBB',
                    error: uploadError.message,
                    details: uploadError.toString()
                });
            }
        }

        console.log('Update data:', { ...updateData, logo: updateData.logo ? 'ImgBB URL' : undefined });

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
