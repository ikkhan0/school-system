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
        const { class_id, section_id } = req.query;

        let query = { school_id: req.user.school_id, is_active: true };

        // Add filters if provided
        if (class_id) query.class_id = class_id;
        if (section_id) query.section_id = section_id;

        const students = await Student.find(query).populate('family_id').sort({ roll_no: 1 });
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

// @desc    Get Student Profile (Complete)
// @route   GET /api/students/:id/profile
router.get('/:id/profile', protect, async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        }).populate('siblings', 'full_name roll_no class_id section_id photo');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Siblings
// @route   GET /api/students/:id/siblings
router.get('/:id/siblings', protect, async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find siblings by family_id
        const siblings = await Student.find({
            family_id: student.family_id,
            _id: { $ne: student._id },
            school_id: req.user.school_id,
            is_active: true
        }).select('full_name roll_no class_id section_id photo');

        res.json(siblings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Fee Summary
// @route   GET /api/students/:id/fee-summary
router.get('/:id/fee-summary', protect, async (req, res) => {
    try {
        const Fee = require('../models/Fee');

        const fees = await Fee.find({
            student_id: req.params.id,
            school_id: req.user.school_id
        });

        const totalPaid = fees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0);
        const totalDue = fees.reduce((sum, fee) => sum + (fee.amount_due || 0), 0);
        const lastPayment = fees.length > 0 ? fees[fees.length - 1] : null;

        res.json({
            total_paid: totalPaid,
            total_due: totalDue,
            last_payment_date: lastPayment?.payment_date || null,
            last_payment_amount: lastPayment?.amount_paid || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Attendance Summary
// @route   GET /api/students/:id/attendance-summary
router.get('/:id/attendance-summary', protect, async (req, res) => {
    try {
        const DailyLog = require('../models/DailyLog');

        const logs = await DailyLog.find({
            student_id: req.params.id,
            school_id: req.user.school_id
        });

        const totalDays = logs.length;
        const presentDays = logs.filter(log => log.status === 'Present').length;
        const absentDays = logs.filter(log => log.status === 'Absent').length;
        const leaveDays = logs.filter(log => log.status === 'Leave').length;
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

        res.json({
            total_days: totalDays,
            present: presentDays,
            absent: absentDays,
            leave: leaveDays,
            percentage: parseFloat(percentage)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Exam Results
// @route   GET /api/students/:id/exam-results
router.get('/:id/exam-results', protect, async (req, res) => {
    try {
        const Result = require('../models/Result');

        const results = await Result.find({
            student_id: req.params.id,
            school_id: req.user.school_id
        }).populate('exam_id', 'name date').sort({ createdAt: -1 }).limit(5);

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
