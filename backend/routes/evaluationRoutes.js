const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');
const Student = require('../models/Student');
const Family = require('../models/Family');

const { protect } = require('../middleware/auth');

// @desc    Get Daily Logs for a class (or initialize them)
// @route   GET /api/evaluation/list?class_id=X&section_id=Y&date=YYYY-MM-DD
router.get('/list', protect, async (req, res) => {
    try {
        const { class_id, section_id, date } = req.query;
        if (!class_id || !section_id || !date) {
            return res.status(400).json({ message: 'Class, Section, and Date are required' });
        }

        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);

        // 1. Get all students
        const students = await Student.find({ class_id, section_id, is_active: true, school_id: req.user.school_id }).populate('family_id'); // Added school_id check

        // 2. Get existing logs
        const existingLogs = await DailyLog.find({
            student_id: { $in: students.map(s => s._id) },
            date: queryDate
        });

        // 3. Merge
        const responseList = students.map(student => {
            const log = existingLogs.find(l => l.student_id.toString() === student._id.toString());

            return {
                student_id: student._id,
                name: student.full_name,
                roll_no: student.roll_no,
                father_name: student.family_id?.father_name || student.father_name,
                father_mobile: student.family_id?.father_mobile,
                log_id: log ? log._id : null,
                status: log ? log.status : 'Present',

                // Violations (Default False)
                uniform_violation: log ? log.uniform_violation : false,
                shoes_violation: log ? log.shoes_violation : false,
                hygiene_violation: log ? log.hygiene_violation : false,
                late_violation: log ? log.late_violation : false,
                homework_violation: log ? log.homework_violation : false,
                books_violation: log ? log.books_violation : false,

                teacher_remarks: log ? log.teacher_remarks : ''
            };
        });

        res.json(responseList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Save/Update Bulk Evaluation
// @route   POST /api/evaluation/save
router.post('/save', protect, async (req, res) => {
    try {
        const { date, evaluations } = req.body;
        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);

        const bulkOps = evaluations.map(evalData => ({
            updateOne: {
                filter: { student_id: evalData.student_id, date: logDate, school_id: req.user.school_id },
                update: { $set: { ...evalData, date: logDate, school_id: req.user.school_id } },
                upsert: true
            }
        }));

        await DailyLog.bulkWrite(bulkOps);

        const absentees = evaluations.filter(e => e.status === 'Absent');
        res.json({ message: 'Saved successfully', absentees_count: absentees.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
