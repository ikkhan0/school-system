const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const DailyLog = require('../models/DailyLog');
const Fee = require('../models/Fee');
const Family = require('../models/Family');
const { protect } = require('../middleware/auth');

// @desc    Get Dashboard Stats
// @route   GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
    try {
        // 1. Total Active Students (Scoped to School)
        const totalStudents = await Student.countDocuments({ is_active: true, school_id: req.user.school_id });

        // 2. Total Classes
        const Class = require('../models/Class');
        const totalClasses = await Class.countDocuments({ school_id: req.user.school_id });

        // 3. Today's Attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const logsToday = await DailyLog.find({ date: today, school_id: req.user.school_id });
        const todayPresent = logsToday.filter(l => l.status === 'Present').length;
        const todayAbsent = logsToday.filter(l => l.status === 'Absent').length;

        // 4. Fee Outstanding & Defaulters
        const fees = await Fee.find({ school_id: req.user.school_id });

        let totalFeeOutstanding = 0;
        let feeDefaulters = 0;

        fees.forEach(fee => {
            const outstanding = (fee.amount_due || 0) - (fee.amount_paid || 0);
            if (outstanding > 0) {
                totalFeeOutstanding += outstanding;
                feeDefaulters++;
            }
        });

        // 5. Upcoming Exams (active exams)
        const Exam = require('../models/Exam');
        const upcomingExams = await Exam.countDocuments({
            school_id: req.user.school_id,
            is_active: true
        });

        res.json({
            totalStudents,
            totalClasses,
            todayPresent,
            todayAbsent,
            totalFeeOutstanding,
            feeDefaulters,
            upcomingExams
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Today's Absents with Parent Contact
// @route   GET /api/dashboard/absents
router.get('/absents', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find logs where status is Absent (Scoped to School)
        const absentLogs = await DailyLog.find({ date: today, status: 'Absent', school_id: req.user.school_id })
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
router.get('/warnings', protect, async (req, res) => {
    try {
        // Complex logic simplified: 
        // Get logs for last 3 days. Group by student. Check if all 3 are absent.

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        const recentLogs = await DailyLog.find({
            date: { $gte: threeDaysAgo },
            status: 'Absent',
            school_id: req.user.school_id
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
