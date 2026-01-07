const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Student = require('../models/Student');

const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Create Exam
// @route   POST /api/exams
router.post('/', protect, checkPermission('exams.create'), async (req, res) => {
    try {
        const exam = await Exam.create({
            ...req.body,
            tenant_id: req.tenant_id
        });
        res.status(201).json(exam);
    } catch (error) {
        // Check for duplicate key error (MongoDB error code 11000)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.title) {
            return res.status(400).json({ message: 'An exam with this title already exists. Please use a different title.' });
        }
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update Exam
// @route   PUT /api/exams/:id
router.put('/:id', protect, checkPermission('exams.edit'), async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, tenant_id: req.tenant_id });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Update exam fields
        Object.assign(exam, req.body);
        await exam.save();

        res.json(exam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get All Exams (Active and Inactive)
// @route   GET /api/exams
router.get('/', protect, checkPermission('exams.view'), async (req, res) => {
    try {
        // Return all exams, not just active ones
        const exams = await Exam.find({ tenant_id: req.tenant_id }).sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete Exam
// @route   DELETE /api/exams/:id
router.delete('/:id', protect, checkPermission('exams.delete'), async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, tenant_id: req.tenant_id });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if any results/marks exist for this exam
        const resultsCount = await Result.countDocuments({ exam_id: req.params.id, tenant_id: req.tenant_id });

        if (resultsCount > 0) {
            return res.status(400).json({
                message: `Cannot delete exam. ${resultsCount} student result(s) exist for this exam. Please delete all marks/results first.`,
                hasResults: true,
                resultsCount: resultsCount
            });
        }

        // No results found, safe to delete
        await Exam.findByIdAndDelete(req.params.id);
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle Exam Active Status
// @route   PATCH /api/exams/:id/toggle-active
router.patch('/:id/toggle-active', protect, async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, tenant_id: req.tenant_id });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Toggle the is_active status
        exam.is_active = !exam.is_active;
        await exam.save();

        res.json({
            message: `Exam ${exam.is_active ? 'activated' : 'deactivated'} successfully`,
            exam: exam
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Exam Subject Configuration for Class (and optionally Section)
// @route   GET /api/exams/:exam_id/subjects/:class_id?section_id=A
router.get('/:exam_id/subjects/:class_id', protect, async (req, res) => {
    try {
        const { exam_id, class_id } = req.params;
        const { section_id } = req.query;

        const exam = await Exam.findOne({ _id: exam_id, tenant_id: req.tenant_id });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Find class configuration in exam subjects
        const classConfig = exam.subjects.find(s => s.class_id === class_id);

        if (!classConfig) {
            return res.json({ subjects: [] });
        }

        // If section_id provided, check if that section is configured for this exam
        if (section_id && classConfig.sections && classConfig.sections.length > 0) {
            if (!classConfig.sections.includes(section_id)) {
                return res.json({
                    subjects: [],
                    message: `Section ${section_id} is not configured for this exam in ${class_id}`
                });
            }
        }

        // Return the subject list with all configurations
        res.json({
            exam_title: exam.title,
            exam_type: exam.exam_type,
            configured_sections: classConfig.sections || [],
            subjects: classConfig.subject_list
        });
    } catch (error) {
        console.error('Error fetching exam subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Save Marks (Bulk)
// @route   POST /api/exams/marks
router.post('/marks', protect, checkPermission('exams.results'), async (req, res) => {
    try {
        const { exam_id, class_id, section_id, subject, marks_data, passing_marks, passing_percentage } = req.body;
        // marks_data = [{ student_id, obtained_marks, total_marks }]

        console.log('=== MARKS SAVE DEBUG ===');
        console.log('Exam ID:', exam_id);
        console.log('Class:', class_id);
        console.log('Section:', section_id);
        console.log('Subject:', subject);
        console.log('Passing marks:', passing_marks);
        console.log('Passing percentage:', passing_percentage);
        console.log('Number of students:', marks_data.length);

        for (const data of marks_data) {
            console.log(`Processing student ${data.student_id}: ${data.obtained_marks}/${data.total_marks}`);

            let result = await Result.findOne({
                exam_id,
                student_id: data.student_id,
                school_id: req.tenant_id
            });

            if (!result) {
                console.log('Creating new result record for student:', data.student_id);
                result = new Result({
                    exam_id,
                    tenant_id: req.tenant_id,
                    school_id: req.tenant_id, // Required field
                    student_id: data.student_id,
                    class_id,
                    section_id,
                    subjects: [],
                    total_obtained: 0,
                    total_max: 0,
                    percentage: 0,
                    grade: 'F',
                    status: 'FAIL'
                });
            } else {
                console.log('Found existing result record for student:', data.student_id);
            }

            // Update or Add Subject
            const subIndex = result.subjects.findIndex(s => s.subject_name === subject);
            if (subIndex > -1) {
                console.log(`Updating existing subject ${subject} at index ${subIndex}`);
                result.subjects[subIndex].obtained_marks = data.obtained_marks;
                result.subjects[subIndex].total_marks = data.total_marks;
                result.subjects[subIndex].passing_marks = passing_marks;
                result.subjects[subIndex].passing_percentage = passing_percentage;
            } else {
                console.log(`Adding new subject ${subject}`);
                result.subjects.push({
                    subject_name: subject,
                    obtained_marks: data.obtained_marks,
                    total_marks: data.total_marks,
                    passing_marks: passing_marks,
                    passing_percentage: passing_percentage
                });
            }

            // Recalculate totals
            result.total_obtained = result.subjects.reduce((sum, s) => sum + s.obtained_marks, 0);
            result.total_max = result.subjects.reduce((sum, s) => sum + s.total_marks, 0);
            result.percentage = result.total_max > 0 ? (result.total_obtained / result.total_max) * 100 : 0;

            // Assign Grade
            if (result.percentage >= 90) result.grade = 'A+';
            else if (result.percentage >= 80) result.grade = 'A';
            else if (result.percentage >= 70) result.grade = 'B';
            else if (result.percentage >= 60) result.grade = 'C';
            else if (result.percentage >= 50) result.grade = 'D';
            else result.grade = 'F';

            // Calculate overall PASS/FAIL status (all subjects must pass)
            const allSubjectsPassed = result.subjects.every(sub => sub.obtained_marks >= sub.passing_marks);
            result.status = allSubjectsPassed ? 'PASS' : 'FAIL';

            console.log('Saving result:', {
                student_id: data.student_id,
                subjects: result.subjects.length,
                total: `${result.total_obtained}/${result.total_max}`,
                percentage: result.percentage,
                grade: result.grade,
                status: result.status
            });

            await result.save();
            console.log('✅ Result saved successfully for student:', data.student_id);
        }

        console.log('=== ALL MARKS SAVED ===');
        res.json({ message: 'Marks saved successfully' });
    } catch (error) {
        console.error('❌ Error saving marks:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: error.message });
    }
});

const DailyLog = require('../models/DailyLog');
const Fee = require('../models/Fee'); // Add Fee model import

// @desc    Get Result Card Data for Class
// @route   GET /api/exams/results?exam_id=X&class_id=Y&section_id=Z
router.get('/results', protect, checkPermission('exams.view'), async (req, res) => {
    try {
        const { exam_id, class_id, section_id } = req.query;

        console.log('=== RESULTS QUERY DEBUG ===');
        console.log('Query params:', { exam_id, class_id, section_id });
        console.log('Tenant ID:', req.tenant_id);

        const query = {
            exam_id,
            class_id,
            section_id,
            school_id: req.tenant_id
        };

        console.log('MongoDB query:', query);

        const results = await Result.find(query)
            .populate({
                path: 'student_id',
                select: 'full_name roll_no father_name father_mobile mother_mobile student_mobile class_id section_id photo image email'
            })
            .populate('exam_id');

        console.log(`Found ${results.length} results`);

        if (results.length > 0) {
            console.log('Sample result:', {
                student_id: results[0].student_id?._id,
                exam_id: results[0].exam_id?._id,
                class_id: results[0].class_id,
                section_id: results[0].section_id,
                subjects: results[0].subjects.length,
                tenant_id: results[0].tenant_id,
                school_id: results[0].school_id
            });
        }

        // Aggregate Stats (Attendance, Fees, Behavior)
        const detailedResults = await Promise.all(results.map(async (r) => {
            const studentId = r.student_id._id;

            // 1. Attendance Stats (All logs for this student)
            const logs = await DailyLog.find({ student_id: studentId });
            const present = logs.filter(l => l.status === 'Present').length;
            const absent = logs.filter(l => l.status === 'Absent').length;
            const leave = logs.filter(l => l.status === 'Leave').length;

            // 2. Fee Stats (Total Balance)
            const fees = await Fee.find({ student_id: studentId });
            const totalBalance = fees.reduce((sum, f) => sum + f.balance, 0);

            // 3. Behavior Stats (Violations Count)
            const behavior = {
                uniform: logs.filter(l => l.uniform_violation).length,
                hygiene: logs.filter(l => l.hygiene_violation).length,
                homework: logs.filter(l => l.homework_violation).length,
                late: logs.filter(l => l.late_violation).length,
                books: logs.filter(l => l.books_violation).length,
                shoes: logs.filter(l => l.shoes_violation).length
            };

            return {
                ...r.toObject(),
                stats: {
                    attendance: { present, absent, leave },
                    fees: { balance: totalBalance },
                    behavior
                }
            };
        }));

        res.json(detailedResults);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
