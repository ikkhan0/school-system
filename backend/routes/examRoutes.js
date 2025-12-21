const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Student = require('../models/Student');

const { protect } = require('../middleware/auth');

// @desc    Create Exam
// @route   POST /api/exams
router.post('/', protect, async (req, res) => {
    try {
        const exam = await Exam.create({
            ...req.body,
            school_id: req.user.school_id
        });
        res.status(201).json(exam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get Active Exams
// @route   GET /api/exams
router.get('/', protect, async (req, res) => {
    try {
        const exams = await Exam.find({ is_active: true, school_id: req.user.school_id });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Save Marks (Bulk)
// @desc    Save Marks (Bulk)
// @route   POST /api/exams/marks
router.post('/marks', protect, async (req, res) => {
    try {
        const { exam_id, class_id, section_id, subject, marks_data } = req.body;
        // marks_data = [{ student_id, obtained_marks, total_marks }]

        for (const data of marks_data) {
            let result = await Result.findOne({ exam_id, student_id: data.student_id, school_id: req.user.school_id });
            if (!result) {
                result = new Result({
                    exam_id,
                    school_id: req.user.school_id,
                    student_id: data.student_id,
                    class_id,
                    section_id,
                    subjects: []
                });
            }

            // Update or Add Subject
            const subIndex = result.subjects.findIndex(s => s.subject_name === subject);
            if (subIndex > -1) {
                result.subjects[subIndex].obtained_marks = data.obtained_marks;
                result.subjects[subIndex].total_marks = data.total_marks;
            } else {
                result.subjects.push({
                    subject_name: subject,
                    obtained_marks: data.obtained_marks,
                    total_marks: data.total_marks
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

            await result.save();
        }

        res.json({ message: 'Marks saved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Result Card Data for Class
// @route   GET /api/exams/results?exam_id=X&class_id=Y&section_id=Z
router.get('/results', protect, async (req, res) => {
    try {
        const { exam_id, class_id, section_id } = req.query;
        const results = await Result.find({ exam_id, class_id, section_id, school_id: req.user.school_id })
            .populate('student_id')
            .populate('exam_id');
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
