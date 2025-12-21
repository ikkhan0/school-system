const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const DailyLog = require('../models/DailyLog');
const Fee = require('../models/Fee');
const Family = require('../models/Family');

// @desc    Get Dashboard Stats
// @route   GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        // 1. Total Active Students
        const totalStudents = await Student.countDocuments({ is_active: true });

        // 2. Today's Attendance %
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const logsToday = await DailyLog.find({ date: today });
        const presentCount = logsToday.filter(l => l.status === 'Present').length;
        const absentCount = logsToday.filter(l => l.status === 'Absent').length;

        // If no logs yet, assume 0% or N/A. If logs exist:
        const totalLogged = logsToday.length;
        const attendancePercentage = totalLogged > 0 ? ((presentCount / totalLogged) * 100).toFixed(1) : 0;

        // 3. Monthly Collection (Cash Flow)
        // Aggregation to sum 'paid_amount' for payments made THIS month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const feeStats = await Fee.aggregate([
            { $match: { payment_date: { $gte: startOfMonth } } }, // Payments *received* this month
            { $group: { _id: null, total: { $sum: "$paid_amount" } } }
        ]);
        const monthlyCollection = feeStats.length > 0 ? feeStats[0].total : 0;

        res.json({
            totalStudents,
            attendancePercentage,
            presentCount,
            absentCount,
            monthlyCollection
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Today's Absents with Parent Contact
// @route   GET /api/dashboard/absents
router.get('/absents', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find logs where status is Absent
        const absentLogs = await DailyLog.find({ date: today, status: 'Absent' })
            .populate({
                path: 'student_id',
                populate: { path: 'family_id' }
            });

        const absents = absentLogs.map(log => ({
            student_name: log.student_id?.full_name || 'Unknown',
            roll_no: log.student_id?.roll_no || 'N/A',
            class_id: log.student_id?.class_id,
            section_id: log.student_id?.section_id,
            father_mobile: log.student_id?.family_id?.father_mobile || log.student_id?.father_name // Fallback/logic
        }));

        res.json(absents);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get 3-Day Consecutive Absents
// @route   GET /api/dashboard/warnings
router.get('/warnings', async (req, res) => {
    try {
        // Complex logic simplified: 
        // Get logs for last 3 days. Group by student. Check if all 3 are absent.

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        const recentLogs = await DailyLog.find({
            date: { $gte: threeDaysAgo },
            status: 'Absent'
        });

        // Count occurrences of student_id
        const countMap = {};
        recentLogs.forEach(log => {
            const sid = log.student_id.toString();
            countMap[sid] = (countMap[sid] || 0) + 1;
        });

        // Filter those with >= 3 absences recently
        const warningIds = Object.keys(countMap).filter(id => countMap[id] >= 3);

        const students = await Student.find({ _id: { $in: warningIds } })
            .populate('family_id');

        res.json(students);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
