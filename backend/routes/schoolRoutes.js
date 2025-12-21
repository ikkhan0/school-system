const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const School = require('../models/School');
const multer = require('multer');
const path = require('path');

// Multer Config for Logo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `school-logo-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
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
// Note: Multer upload is optional - may not work on Vercel serverless
const uploadMiddleware = (req, res, next) => {
    upload.single('logo')(req, res, (err) => {
        if (err) {
            console.log('File upload error (non-fatal):', err.message);
            // Continue without file upload
            req.fileUploadError = err.message;
        }
        next();
    });
};

router.put('/', protect, uploadMiddleware, async (req, res) => {
    try {
        console.log('=== SCHOOL UPDATE DEBUG ===');
        console.log('Body:', req.body);
        console.log('File:', req.file);
        console.log('File upload error:', req.fileUploadError);
        console.log('User school_id:', req.user.school_id);

        // Prepare update data
        const updateData = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.address !== undefined) updateData.address = req.body.address;
        if (req.body.phone !== undefined) updateData.phone = req.body.phone;
        if (req.body.email !== undefined) updateData.email = req.body.email;

        // Only update logo if file was successfully uploaded
        if (req.file && !req.fileUploadError) {
            updateData.logo = `/uploads/${req.file.filename}`;
            console.log('Logo file uploaded:', req.file.filename);
        } else if (req.fileUploadError) {
            console.log('Skipping logo update due to upload error');
        }

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

        const response = {
            ...school.toObject(),
            logoUploadWarning: req.fileUploadError ? 'Logo upload not supported on this server' : null
        };

        res.json(response);
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
