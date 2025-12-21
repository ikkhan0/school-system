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
router.put('/', protect, upload.single('logo'), async (req, res) => {
    try {
        const school = await School.findById(req.user.school_id);
        if (!school) return res.status(404).json({ message: 'School not found' });

        // Update fields - use !== undefined to allow empty strings
        if (req.body.name !== undefined) school.name = req.body.name;
        if (req.body.address !== undefined) school.address = req.body.address;
        if (req.body.phone !== undefined) school.phone = req.body.phone;
        if (req.body.email !== undefined) school.email = req.body.email;

        if (req.file) {
            school.logo = `/uploads/${req.file.filename}`;
        }

        const updatedSchool = await school.save();
        res.json(updatedSchool);
    } catch (error) {
        console.error('Error updating school:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
