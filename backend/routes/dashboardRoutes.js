const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Staff = require('../models/Staff');

// GET /api/dashboard/stats - Existing stats
router.get('/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ status: 'Active' });
        const totalStaff = await Staff.countDocuments();

        // Today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttendance = await Attendance.find({
            date: { $gte: today }
        });

        const todayPresent = todayAttendance.filter(a => a.status === 'Present').length;
        const todayAbsent = todayAttendance.filter(a => a.status === 'Absent').length;

        // Fee defaulters
        const defaulters = await Fee.find({ status: { $ne: 'Paid' } });
        const totalFeeOutstanding = defaulters.reduce((sum, f) => sum + f.balance, 0);

        res.json({
            totalStudents,
            totalStaff,
            todayPresent,
            todayAbsent,
            feeDefaulters: defaulters.length,
            totalFeeOutstanding
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/dashboard/charts - New endpoint for chart data
router.get('/charts', async (req, res) => {
    try {
        // Fee Collection Chart - Last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const feeData = await Fee.aggregate([
            {
                $match: {
                    payment_date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $substr: ['$month', 0, 8] }, // Group by month (e.g., "Dec-2025")
                    collected: { $sum: '$paid_amount' },
                    pending: { $sum: '$balance' }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 6 }
        ]);

        const feeCollection = feeData.map(item => ({
            month: item._id,
            collected: item.collected,
            pending: item.pending
        }));

        // Attendance Chart - Last 4 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: fourWeeksAgo }
                }
            },
            {
                $group: {
                    _id: {
                        week: { $week: '$date' }
                    },
                    present: {
                        $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
                    },
                    total: { $sum: 1 }
                }
            },
            { $sort: { '_id.week': 1 } }
        ]);

        const attendance = attendanceData.map((item, index) => ({
            week: `Week ${index + 1}`,
            rate: item.total > 0 ? ((item.present / item.total) * 100).toFixed(1) : 0
        }));

        // Performance Chart - Grade distribution from latest results
        const gradeData = await Result.aggregate([
            {
                $group: {
                    _id: '$grade',
                    count: { $sum: 1 }
                }
            }
        ]);

        const performance = gradeData.map(item => ({
            grade: item._id,
            count: item.count
        }));

        // Enrollment Chart - Last 6 months
        const enrollmentData = await Student.aggregate([
            {
                $match: {
                    admission_date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$admission_date' },
                        month: { $month: '$admission_date' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const enrollment = enrollmentData.map(item => ({
            month: `${monthNames[item._id.month - 1]}`,
            count: item.count
        }));

        res.json({
            feeCollection,
            attendance,
            performance,
            enrollment
        });
    } catch (error) {
        console.error('Chart data error:', error);
        res.json({
            feeCollection: [],
            attendance: [],
            performance: [],
            enrollment: []
        });
    }
});

module.exports = router;
