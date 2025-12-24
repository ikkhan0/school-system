const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const Student = require('../models/Student');
const Family = require('../models/Family');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

const multer = require('multer');
const path = require('path');
const { parseFile, validateStudentData, generateSampleCSV } = require('../utils/importStudents');


// Multer Config - Memory storage for Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Multer Config for CSV/Excel Import
const uploadCSV = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const filetypes = /csv|xlsx|xls/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype === 'text/csv' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Error: CSV or Excel files only!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ==================== IMPORT ROUTES ====================

// @desc    Download Sample CSV Template
// @route   GET /api/students/import/sample
router.get('/import/sample', protect, async (req, res) => {
    try {
        // Get available classes for this school
        const Class = require('../models/Class');
        const availableClasses = await Class.find({
            tenant_id: req.tenant_id
        }).select('name sections');

        const csvContent = generateSampleCSV(availableClasses);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=student_import_sample.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Error generating sample CSV:', error);
        res.status(500).json({ message: 'Failed to generate sample file' });
    }
});

// @desc    Upload and Validate CSV/Excel File
// @route   POST /api/students/import/validate
router.post('/import/validate', protect, uploadCSV.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Parse the file
        const students = await parseFile(req.file.buffer, req.file.mimetype);

        if (!students || students.length === 0) {
            return res.status(400).json({ message: 'No data found in file' });
        }

        // Get existing roll numbers for this school
        const existingStudents = await Student.find({
            tenant_id: req.tenant_id,
            is_active: true
        }).select('roll_no');
        const existingRollNumbers = existingStudents.map(s => s.roll_no);

        // Get available classes for this school
        const Class = require('../models/Class');
        const availableClasses = await Class.find({
            tenant_id: req.tenant_id
        }).select('name sections');

        // Validate the data
        const validation = validateStudentData(students, existingRollNumbers, availableClasses);

        res.json({
            success: true,
            validation: validation
        });
    } catch (error) {
        console.error('Error validating import file:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Import Validated Students
// @route   POST /api/students/import/confirm
router.post('/import/confirm', protect, async (req, res) => {
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'No valid students to import' });
        }

        const importResults = {
            success: [],
            failed: []
        };

        const Fee = require('../models/Fee');

        // Process each student
        for (const studentData of students) {
            try {
                const { father_name, father_mobile, father_cnic, mother_name, mother_cnic, ...restData } = studentData;

                // Find or create family
                let family = await Family.findOne({
                    father_mobile,
                    tenant_id: req.tenant_id
                });

                if (!family) {
                    family = await Family.create({
                        father_name: father_name || 'N/A',
                        father_mobile,
                        father_cnic: father_cnic || '',
                        mother_name: mother_name || '',
                        mother_cnic: mother_cnic || '',
                        tenant_id: req.tenant_id
                    });
                }

                // Create student
                const student = await Student.create({
                    ...restData,
                    father_name: father_name || family.father_name,
                    mother_name: mother_name || family.mother_name,
                    family_id: family._id,
                    tenant_id: req.tenant_id,
                    monthly_fee: studentData.monthly_fee || 5000,
                    category: studentData.category || 'Regular',
                    nationality: studentData.nationality || 'Pakistani',
                    is_active: true
                });

                // Create initial fee voucher
                const currentDate = new Date();
                const currentMonth = currentDate.toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                });

                const feeAmount = Number(student.monthly_fee) || 5000;
                const grossAmount = feeAmount;

                await Fee.create({
                    tenant_id: req.tenant_id,
                    student_id: student._id,
                    month: currentMonth,
                    tuition_fee: feeAmount,
                    concession: 0,
                    other_charges: 0,
                    arrears: 0,
                    gross_amount: grossAmount,
                    paid_amount: 0,
                    balance: grossAmount,
                    status: 'Pending'
                });

                importResults.success.push({
                    roll_no: student.roll_no,
                    full_name: student.full_name,
                    class: `${student.class_id}-${student.section_id}`
                });

            } catch (error) {
                console.error('Error importing student:', error);
                importResults.failed.push({
                    data: studentData,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            results: importResults,
            summary: {
                total: students.length,
                imported: importResults.success.length,
                failed: importResults.failed.length
            }
        });

    } catch (error) {
        console.error('Error confirming import:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== END IMPORT ROUTES ====================

router.post('/add', protect, checkPermission('students.create'), upload.single('image'), async (req, res) => {
    try {
        const { father_name, father_mobile, father_cnic, subjects, monthly_fee, concession, ...studentData } = req.body;

        // Check if family exists or create (Scoped to School)
        let family = await Family.findOne({ father_mobile, tenant_id: req.tenant_id });
        if (!family) {
            family = await Family.create({
                father_name,
                father_mobile,
                father_cnic,
                tenant_id: req.tenant_id
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

        // Upload photo to Cloudinary if provided
        let photoUrl = '';
        if (req.file) {
            try {
                console.log('📤 Starting student photo upload to Cloudinary...');
                console.log('File size:', req.file.size, 'bytes');
                console.log('File mimetype:', req.file.mimetype);

                const result = await uploadToCloudinary(
                    req.file.buffer,
                    'student-photos',
                    `student_${Date.now()}`
                );
                photoUrl = result.secure_url;
                console.log('✅ Student photo uploaded to Cloudinary:', photoUrl);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError);
                console.error('Error details:', {
                    message: uploadError.message,
                    stack: uploadError.stack,
                    name: uploadError.name
                });
                // Continue without photo if upload fails
                console.warn('⚠️ Continuing student creation without photo');
            }
        }

        const student = await Student.create({
            ...studentData,
            photo: photoUrl,
            family_id: family._id,
            father_name: father_name, // keep denormalized copy
            tenant_id: req.tenant_id,
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
            tenant_id: req.tenant_id,
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
router.get('/', protect, checkPermission('students.view'), async (req, res) => {
    try {
        const { search } = req.query;
        let query = { tenant_id: req.tenant_id, is_active: true };

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

        let query = { tenant_id: req.tenant_id }; // Removed is_active filter to show all students

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
router.delete('/:id', protect, checkPermission('students.delete'), async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Verify student belongs to user's school
        if (student.school_id.toString() !== req.tenant_id.toString()) {
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find siblings by family_id
        const siblings = await Student.find({
            family_id: student.family_id,
            _id: { $ne: student._id },
            tenant_id: req.tenant_id,
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
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
router.put('/:id', protect, checkPermission('students.edit'), upload.single('image'), async (req, res) => {
    try {
        const { father_name, father_mobile, father_cnic, subjects, ...studentData } = req.body;

        const student = await Student.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update family info if provided
        if (father_mobile) {
            let family = await Family.findOne({ father_mobile, tenant_id: req.tenant_id });
            if (!family) {
                family = await Family.create({
                    father_name,
                    father_mobile,
                    father_cnic,
                    tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update family information if provided
        if (father_mobile) {
            let family = await Family.findOne({ father_mobile, tenant_id: req.tenant_id });
            if (!family) {
                family = await Family.create({
                    father_name,
                    father_mobile,
                    father_cnic,
                    tenant_id: req.tenant_id
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
            try {
                // Delete old photo from Cloudinary if exists
                if (student.photo) {
                    const oldPublicId = getPublicIdFromUrl(student.photo);
                    if (oldPublicId) {
                        await deleteFromCloudinary(oldPublicId);
                    }
                }

                // Upload new photo
                const result = await uploadToCloudinary(
                    req.file.buffer,
                    'student-photos',
                    `student_${student._id}_${Date.now()}`
                );
                student.photo = result.secure_url;
                console.log('Student photo updated on Cloudinary:', result.secure_url);
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                // Continue without updating photo if upload fails
            }
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
