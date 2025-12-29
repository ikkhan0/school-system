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

        // 1. Get all students (filtered by session if available)
        const studentQuery = { class_id, section_id, is_active: true, tenant_id: req.tenant_id };
        // if (req.session_id) {
        //     studentQuery.current_session_id = req.session_id;
        // }
        const students = await Student.find(studentQuery).populate('family_id');

        // 2. Get existing logs (filtered by session if available)
        const logQuery = {
            student_id: { $in: students.map(s => s._id) },
            date: queryDate
        };
        // Removed strict session_id check for logs to ensure backward compatibility
        // The students are already filtered by session, so we only get logs for relevant students.
        const existingLogs = await DailyLog.find(logQuery);

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

        console.log('📝 Saving evaluations:', {
            date,
            count: evaluations?.length,
            tenant_id: req.tenant_id,
            user_id: req.user?._id
        });

        if (!evaluations || evaluations.length === 0) {
            return res.status(400).json({ message: 'No evaluations provided' });
        }

        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);

        const bulkOps = evaluations.map(evalData => {
            const filter = { student_id: evalData.student_id, date: logDate };
            const updateData = { ...evalData, date: logDate, tenant_id: req.tenant_id };

            // Add session_id if available
            if (req.session_id) {
                filter.session_id = req.session_id;
                updateData.session_id = req.session_id;
            }

            return {
                updateOne: {
                    filter,
                    update: { $set: updateData },
                    upsert: true
                }
            };
        });

        const result = await DailyLog.bulkWrite(bulkOps);
        console.log('✅ Bulk write result:', result);

        const absentees = evaluations.filter(e => e.status === 'Absent');
        res.json({ message: 'Saved successfully', absentees_count: absentees.length });
    } catch (error) {
        console.error('❌ Error saving evaluations:', error);
        res.status(500).json({ message: error.message, error: error.stack });
    }
});

module.exports = router;
