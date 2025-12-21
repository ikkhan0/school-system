const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Student = require('../models/Student');
const Family = require('../models/Family');

const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `student-${Date.now()}${path.extname(file.originalname)}`);
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

// @desc    Add a Student
// @route   POST /api/students/add
router.post('/add', protect, upload.single('image'), async (req, res) => {
    try {
        const { father_name, father_mobile, father_cnic, ...studentData } = req.body;
        // Check if family exists or create (Scoped to School)
        let family = await Family.findOne({ father_mobile, school_id: req.user.school_id });
        if (!family) {
            family = await Family.create({
                father_name,
                father_mobile,
                father_cnic,
                school_id: req.user.school_id
            });
        }

        const student = await Student.create({
            ...studentData,
            image: req.file ? `/uploads/${req.file.filename}` : '',
            family_id: family._id,
            father_name: father_name, // keep denormalized copy
            school_id: req.user.school_id
        });

        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get Students (Search or All)
// @route   GET /api/students?search=xyz
router.get('/', protect, async (req, res) => {
    try {
        const { search } = req.query;
        let query = { school_id: req.user.school_id, is_active: true };

        if (search) {
            query.$or = [
                { roll_no: search },
                { full_name: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await Student.find(query).populate('family_id');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/list', protect, async (req, res) => {
    try {
        const students = await Student.find({ school_id: req.user.school_id }).populate('family_id');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a Student
// @route   DELETE /api/students/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Verify student belongs to user's school
        if (student.school_id.toString() !== req.user.school_id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Soft delete by setting is_active to false
        student.is_active = false;
        await student.save();

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
