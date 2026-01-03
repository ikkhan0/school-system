const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const DailyLog = require('../models/DailyLog');
const Result = require('../models/Result');
const Staff = require('../models/Staff');
const Class = require('../models/Class');
const Exam = require('../models/Exam');

const { protect } = require('../middleware/auth');

// GET /api/dashboard/stats - Existing stats
router.get('/stats', protect, async (req, res) => {
    try {
        // Filter by tenant_id for multi-tenant isolation
        const tenantId = req.tenant_id;
        const sessionId = req.session_id;

        // Build student query with session filter
        const studentQuery = { tenant_id: tenantId, is_active: true };
        if (sessionId) {
            studentQuery.current_session_id = sessionId;
        }

        const totalStudents = await Student.countDocuments(studentQuery);
        const totalStaff = await Staff.countDocuments({ tenant_id: tenantId });
        const totalClasses = await Class.countDocuments({ tenant_id: tenantId });

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const upcomingExams = await Exam.countDocuments({
            tenant_id: tenantId,
            exam_date: { $gte: todayDate },
            is_active: true
        });

        // Today's attendance with session filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendanceQuery = {
            tenant_id: tenantId,
            date: { $gte: today }
        };
        if (sessionId) {
            attendanceQuery.session_id = sessionId;
        }

        const todayAttendance = await DailyLog.find(attendanceQuery);

        const todayPresent = todayAttendance.filter(a => a.status === 'Present').length;
        const todayAbsent = todayAttendance.filter(a => a.status === 'Absent').length;

        // Fee defaulters - Only unpaid/partial fees for active students in current session
        const feeQuery = {
            tenant_id: tenantId,
            status: { $in: ['Pending', 'Partial'] },
            balance: { $gt: 0 }
        };
        if (sessionId) {
            feeQuery.session_id = sessionId;
        }

        const defaulters = await Fee.find(feeQuery).populate('student_id');

        // Filter to only include active students
        const activeDefaulters = defaulters.filter(fee =>
            fee.student_id &&
            fee.student_id.is_active &&
            (!sessionId || fee.student_id.current_session_id?.toString() === sessionId.toString())
        );

        const totalFeeOutstanding = activeDefaulters.reduce((sum, f) => sum + (f.balance || 0), 0);

        // Get unique student IDs who have outstanding dues
        // Using Set to avoid counting the same student multiple times (e.g., arrears)
        const uniqueStudentsWithDues = new Set(
            activeDefaulters.map(fee => fee.student_id._id.toString())
        );

        res.json({
            totalStudents,
            totalStaff,
            totalClasses,
            upcomingExams,
            todayPresent,
            todayAbsent,
            feeDefaulters: uniqueStudentsWithDues.size, // Count unique students, not fee records
            totalFeeOutstanding: Math.round(totalFeeOutstanding)
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: error.message, error: error.toString() });
    }
});

// GET /api/dashboard/charts - New endpoint for chart data
router.get('/charts', protect, async (req, res) => {
    try {
        const tenantId = req.tenant_id;

        // Fee Collection Chart - Last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const feeData = await Fee.aggregate([
            {
                $match: {
                    tenant_id: tenantId,
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

        const attendanceData = await DailyLog.aggregate([
            {
                $match: {
                    tenant_id: tenantId,
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
                $match: { tenant_id: tenantId }
            },
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
                    tenant_id: tenantId,
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

// GET /api/dashboard/absent-today - Get today's absent students
router.get('/absent-today', protect, async (req, res) => {
    try {
        const tenantId = req.tenant_id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find all absent students for today
        const absentLogs = await DailyLog.find({
            tenant_id: tenantId,
            date: { $gte: today, $lt: tomorrow },
            status: 'Absent'
        }).populate({
            path: 'student_id',
            populate: {
                path: 'family_id'
            }
        });

        const absentStudents = absentLogs.map(log => {
            const student = log.student_id;
            return {
                _id: student._id,
                roll_no: student.roll_no,
                full_name: student.full_name,
                class_id: student.class_id,
                section_id: student.section_id,
                father_name: student.family_id?.father_name || student.father_name,
                father_mobile: student.family_id?.father_mobile || student.father_mobile,
                date: log.date
            };
        });

        res.json(absentStudents);
    } catch (error) {
        console.error('Absent students error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
