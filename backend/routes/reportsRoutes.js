const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const DailyLog = require('../models/DailyLog');
const { protect } = require('../middleware/auth');

// @desc    Get Fee Defaulters (Balance > 0)
// @route   GET /api/reports/defaulters
router.get('/defaulters', protect, async (req, res) => {
    try {
        const students = await Student.find({ is_active: true, school_id: req.user.school_id }).populate('family_id');

        const defaulters = [];
        for (const student of students) {
            // Logic: Check if they have outstanding balance in Fee records
            // For simplicity in this phase, we check the latest fee record or aggregate balances
            // But better: Calculate sum of all 'balance' fields in Fee collection for this student
            const fees = await Fee.find({ student_id: student._id });
            const totalBalance = fees.reduce((sum, f) => sum + f.balance, 0);

            if (totalBalance > 0) {
                defaulters.push({
                    student,
                    totalBalance,
                    father_name: student.family_id?.father_name || student.father_name,
                    father_mobile: student.family_id?.father_mobile
                });
            }
        }
        res.json(defaulters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Attendance Shortage (< 75%)
// @route   GET /api/reports/shortage
router.get('/shortage', protect, async (req, res) => {
    try {
        const students = await Student.find({ is_active: true, school_id: req.user.school_id }).populate('family_id');

        const shortage = [];
        for (const student of students) {
            const logs = await DailyLog.find({ student_id: student._id });
            const totalDays = logs.length;
            if (totalDays === 0) continue; // Skip if no logs

            const present = logs.filter(l => l.status === 'Present').length;
            const percentage = (present / totalDays) * 100;

            if (percentage < 75) {
                shortage.push({
                    student,
                    percentage: percentage.toFixed(1),
                    present,
                    totalDays,
                    father_name: student.family_id?.father_name || student.father_name,
                    father_mobile: student.family_id?.father_mobile
                });
            }
        }
        res.json(shortage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
