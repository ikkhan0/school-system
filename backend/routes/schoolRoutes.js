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
router.put('/', protect, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'principal_signature', maxCount: 1 },
    { name: 'stamp', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('=== SCHOOL UPDATE DEBUG ===');
        console.log('Body:', req.body);
        console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
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

        // Helper function to handle file upload
        const handleFileUpload = async (file, prefix) => {
            try {
                console.log(`📤 Starting ${prefix} upload to ImgBB...`);
                const result = await uploadToImgBB(
                    file.buffer,
                    `school_${req.tenant_id}_${prefix}`
                );
                console.log(`✅ ${prefix} uploaded successfully:`, result.url);
                return result.url;
            } catch (error) {
                console.error(`❌ ImgBB ${prefix} upload error:`, error);
                throw error;
            }
        };

        // Upload Logo
        if (req.files && req.files['logo']) {
            updateData.logo = await handleFileUpload(req.files['logo'][0], 'logo');
        }

        // Upload Principal Signature
        if (req.files && req.files['principal_signature']) {
            updateData.principal_signature = await handleFileUpload(req.files['principal_signature'][0], 'signature');
        }

        // Upload Stamp
        if (req.files && req.files['stamp']) {
            updateData.stamp = await handleFileUpload(req.files['stamp'][0], 'stamp');
        }

        console.log('Update data keys:', Object.keys(updateData));

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
