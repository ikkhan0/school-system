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
        const { father_name, father_mobile, father_cnic, subjects, monthly_fee, concession, ...studentData } = req.body;

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

        // Prepare enrolled_subjects array - only add if subjects exist and are valid
        let enrolled_subjects = [];
        if (subjects && subjects.length > 0) {
            try {
                const subjectIds = Array.isArray(subjects) ? subjects : JSON.parse(subjects);
                // Filter out empty or invalid IDs
                const validSubjectIds = subjectIds.filter(id => id && id.trim() !== '');
                enrolled_subjects = validSubjectIds.map(subject_id => ({
                    subject_id,
                    enrollment_date: new Date(),
                    is_active: true
                }));
            } catch (parseError) {
                console.error('Error parsing subjects:', parseError);
                // Continue without subjects if parsing fails
            }
        }

        const student = await Student.create({
            ...studentData,
            photo: req.file ? `/uploads/${req.file.filename}` : '',
            family_id: family._id,
            father_name: father_name, // keep denormalized copy
            school_id: req.user.school_id,
            enrolled_subjects,
            monthly_fee: monthly_fee || 5000
        });

        // Auto-create initial fee voucher
        const Fee = require('../models/Fee');
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        const feeAmount = Number(monthly_fee) || 5000;
        const concessionAmount = Number(concession) || 0;
        const grossAmount = feeAmount - concessionAmount;

        const feeVoucher = await Fee.create({
            school_id: req.user.school_id,
            student_id: student._id,
            month: currentMonth,
            tuition_fee: feeAmount,
            concession: concessionAmount,
            other_charges: 0,
            arrears: 0,
            gross_amount: grossAmount,
            paid_amount: 0,
            balance: grossAmount,
            status: 'Pending'
        });

        res.status(201).json({
            student,
            feeVoucher
        });
    } catch (error) {
        console.error('Error adding student:', error);
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

        const students = await Student.find(query)
            .populate('family_id')
            .populate('enrolled_subjects.subject_id')
            .sort({ roll_no: 1 });
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

// @desc    Get Student's Enrolled Subjects
// @route   GET /api/students/:id/subjects
router.get('/:id/subjects', protect, async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        }).populate('enrolled_subjects.subject_id');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Filter only active subjects
        const activeSubjects = student.enrolled_subjects.filter(es => es.is_active);

        res.json(activeSubjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Student's Subjects
// @route   PUT /api/students/:id/subjects
router.put('/:id/subjects', protect, async (req, res) => {
    try {
        const { subjects } = req.body; // Array of subject IDs

        const student = await Student.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Replace enrolled_subjects with new selection
        student.enrolled_subjects = subjects.map(subject_id => ({
            subject_id,
            enrollment_date: new Date(),
            is_active: true
        }));

        await student.save();

        // Populate and return updated student
        const updatedStudent = await Student.findById(student._id)
            .populate('enrolled_subjects.subject_id');

        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add New Subject to Student
// @route   POST /api/students/:id/subjects/enroll
router.post('/:id/subjects/enroll', protect, async (req, res) => {
    try {
        const { subject_id } = req.body;

        const student = await Student.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if already enrolled
        const alreadyEnrolled = student.enrolled_subjects.some(
            es => es.subject_id.toString() === subject_id && es.is_active
        );

        if (alreadyEnrolled) {
            return res.status(400).json({ message: 'Student already enrolled in this subject' });
        }

        // Add new subject
        student.enrolled_subjects.push({
            subject_id,
            enrollment_date: new Date(),
            is_active: true
        });

        await student.save();

        const updatedStudent = await Student.findById(student._id)
            .populate('enrolled_subjects.subject_id');

        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Student (including subjects)
// @route   PUT /api/students/:id
router.put('/:id', protect, upload.single('image'), async (req, res) => {
    try {
        const { father_name, father_mobile, father_cnic, subjects, ...studentData } = req.body;

        const student = await Student.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update family info if provided
        if (father_mobile) {
            let family = await Family.findOne({ father_mobile, school_id: req.user.school_id });
            if (!family) {
                family = await Family.create({
                    father_name,
                    father_mobile,
                    father_cnic,
                    school_id: req.user.school_id
                });
            }
            student.family_id = family._id;
            student.father_name = father_name;
        }

        // Update student data
        Object.keys(studentData).forEach(key => {
            if (studentData[key] !== undefined && studentData[key] !== '') {
                student[key] = studentData[key];
            }
        });

        // Update image if provided
        if (req.file) {
            student.image = `/uploads/${req.file.filename}`;
        }

        // Update subjects if provided
        if (subjects) {
            const subjectIds = Array.isArray(subjects) ? subjects : JSON.parse(subjects);
            student.enrolled_subjects = subjectIds.map(subject_id => ({
                subject_id,
                enrollment_date: new Date(),
                is_active: true
            }));
        }

        await student.save();

        const updatedStudent = await Student.findById(student._id)
            .populate('family_id')
            .populate('enrolled_subjects.subject_id');

        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Complete Profile
// @route   GET /api/students/:id/profile
router.get('/:id/profile', protect, async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        })
            .populate('family_id')
            .populate('enrolled_subjects.subject_id');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
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

        const total_days = logs.length;
        const present = logs.filter(log => log.status === 'Present').length;
        const absent = logs.filter(log => log.status === 'Absent').length;
        const leave = logs.filter(log => log.status === 'Leave').length;
        const percentage = total_days > 0 ? Math.round((present / total_days) * 100) : 0;

        res.json({
            total_days,
            present,
            absent,
            leave,
            percentage
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Exam Results
// @route   GET /api/students/:id/exam-results
router.get('/:id/exam-results', protect, async (req, res) => {
    try {
        const ExamResult = require('../models/ExamResult');

        const results = await ExamResult.find({
            student_id: req.params.id,
            school_id: req.user.school_id
        })
            .populate('exam_id')
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Student
// @route   PUT /api/students/:id
router.put('/:id', protect, upload.single('image'), async (req, res) => {
    try {
        const { father_name, father_mobile, father_cnic, subjects, ...studentData } = req.body;

        const student = await Student.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update family information if provided
        if (father_mobile) {
            let family = await Family.findOne({ father_mobile, school_id: req.user.school_id });
            if (!family) {
                family = await Family.create({
                    father_name,
                    father_mobile,
                    father_cnic,
                    school_id: req.user.school_id
                });
            }
            student.family_id = family._id;
        }

        // Update basic student information
        Object.keys(studentData).forEach(key => {
            if (studentData[key] !== undefined && studentData[key] !== '') {
                student[key] = studentData[key];
            }
        });

        // Update photo if new file uploaded
        if (req.file) {
            student.photo = `/uploads/${req.file.filename}`;
        }

        // Update subjects if provided
        if (subjects) {
            try {
                const subjectIds = Array.isArray(subjects) ? subjects : JSON.parse(subjects);
                const validSubjectIds = subjectIds.filter(id => id && id.trim() !== '');
                student.enrolled_subjects = validSubjectIds.map(subject_id => ({
                    subject_id,
                    enrollment_date: new Date(),
                    is_active: true
                }));
            } catch (parseError) {
                console.error('Error parsing subjects:', parseError);
            }
        }

        await student.save();

        const updatedStudent = await Student.findById(student._id)
            .populate('family_id')
            .populate('enrolled_subjects.subject_id');

        res.json(updatedStudent);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
