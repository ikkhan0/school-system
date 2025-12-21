const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Student = require('../models/Student');
const DailyLog = require('../models/DailyLog');
const Fee = require('../models/Fee');
const Exam = require('../models/Exam');
const Result = require('../models/Result'); // Changed from ExamResult

// @desc    Get Fee Defaulters (Balance > 0)
// @route   GET /api/reports/defaulters
router.get('/defaulters', protect, async (req, res) => {
    try {
        const students = await Student.find({ is_active: true, school_id: req.user.school_id }).populate('family_id');

        const defaulters = [];
        for (const student of students) {
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

// @desc    Get Attendance Shortage (<75%)
// @route   GET /api/reports/shortage
router.get('/shortage', protect, async (req, res) => {
    try {
        const students = await Student.find({ is_active: true, school_id: req.user.school_id }).populate('family_id');

        const shortage = [];
        for (const student of students) {
            const logs = await DailyLog.find({ student_id: student._id });
            const totalDays = logs.length;
            if (totalDays === 0) continue;

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

// @desc    Get Attendance Summary Report
// @route   GET /api/reports/attendance-summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&class_id=X&section_id=Y
router.get('/attendance-summary', protect, async (req, res) => {
    try {
        const { start_date, end_date, class_id, section_id } = req.query;

        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
        const endDate = end_date ? new Date(end_date) : new Date();

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        let studentQuery = { school_id: req.user.school_id, is_active: true };
        if (class_id) studentQuery.class_id = class_id;
        if (section_id) studentQuery.section_id = section_id;

        const students = await Student.find(studentQuery);
        const studentIds = students.map(s => s._id);

        const logs = await DailyLog.find({
            student_id: { $in: studentIds },
            date: { $gte: startDate, $lte: endDate },
            school_id: req.user.school_id
        });

        const report = students.map(student => {
            const studentLogs = logs.filter(log => log.student_id.toString() === student._id.toString());
            const present = studentLogs.filter(log => log.status === 'Present').length;
            const absent = studentLogs.filter(log => log.status === 'Absent').length;
            const leave = studentLogs.filter(log => log.status === 'Leave').length;
            const total = studentLogs.length;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

            return {
                student_id: student._id,
                name: student.full_name,
                roll_no: student.roll_no,
                class_id: student.class_id,
                section_id: student.section_id,
                present,
                absent,
                leave,
                total,
                percentage
            };
        });

        res.json({
            start_date: startDate,
            end_date: endDate,
            total_students: students.length,
            report
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Fee Defaulters Report (Enhanced)
// @route   GET /api/reports/fee-defaulters?days=30&class_id=X
router.get('/fee-defaulters', protect, async (req, res) => {
    try {
        const { days = 30, class_id } = req.query;

        let studentQuery = { school_id: req.user.school_id, is_active: true };
        if (class_id) studentQuery.class_id = class_id;

        const students = await Student.find(studentQuery).populate('family_id');

        const defaulters = [];

        for (const student of students) {
            const fees = await Fee.find({
                student_id: student._id,
                school_id: req.user.school_id,
                status: { $in: ['Pending', 'Partial'] }
            }).sort({ month: -1 });

            if (fees.length > 0) {
                const totalDue = fees.reduce((sum, fee) => sum + fee.balance, 0);

                if (totalDue > 0) {
                    defaulters.push({
                        student_id: student._id,
                        name: student.full_name,
                        roll_no: student.roll_no,
                        class_id: student.class_id,
                        section_id: student.section_id,
                        father_mobile: student.family_id?.father_mobile || student.father_mobile,
                        total_due: totalDue,
                        pending_months: fees.length,
                        oldest_due: fees[fees.length - 1].month
                    });
                }
            }
        }

        defaulters.sort((a, b) => b.total_due - a.total_due);

        res.json({
            total_defaulters: defaulters.length,
            total_amount_due: defaulters.reduce((sum, d) => sum + d.total_due, 0),
            defaulters
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Class Performance Report
// @route   GET /api/reports/class-performance?exam_id=X&class_id=Y
router.get('/class-performance', protect, async (req, res) => {
    try {
        const { exam_id, class_id } = req.query;

        if (!exam_id) {
            return res.status(400).json({ message: 'exam_id is required' });
        }

        const exam = await Exam.findById(exam_id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        let studentQuery = { school_id: req.user.school_id, is_active: true };
        if (class_id) studentQuery.class_id = class_id;

        const students = await Student.find(studentQuery);
        const studentIds = students.map(s => s._id);

        const results = await Result.find({
            exam_id,
            student_id: { $in: studentIds }
        }).populate('student_id');

        const totalStudents = results.length;
        const passed = results.filter(r => r.percentage >= 33).length;
        const failed = totalStudents - passed;
        const averagePercentage = totalStudents > 0
            ? (results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents).toFixed(2)
            : 0;

        const topPerformers = results
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 10)
            .map(r => ({
                name: r.student_id.full_name,
                roll_no: r.student_id.roll_no,
                percentage: r.percentage,
                grade: r.grade
            }));

        const needsAttention = results
            .filter(r => r.percentage < 50)
            .map(r => ({
                name: r.student_id.full_name,
                roll_no: r.student_id.roll_no,
                class_id: r.student_id.class_id,
                percentage: r.percentage
            }));

        res.json({
            exam_title: exam.title,
            total_students: totalStudents,
            passed,
            failed,
            pass_percentage: totalStudents > 0 ? ((passed / totalStudents) * 100).toFixed(1) : 0,
            average_percentage: averagePercentage,
            top_performers: topPerformers,
            needs_attention: needsAttention
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Profile Report
// @route   GET /api/reports/student-profile/:student_id
router.get('/student-profile/:student_id', protect, async (req, res) => {
    try {
        const student = await Student.findById(req.params.student_id).populate('family_id');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceLogs = await DailyLog.find({
            student_id: student._id,
            date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 });

        const present = attendanceLogs.filter(log => log.status === 'Present').length;
        const absent = attendanceLogs.filter(log => log.status === 'Absent').length;
        const leave = attendanceLogs.filter(log => log.status === 'Leave').length;
        const attendancePercentage = attendanceLogs.length > 0
            ? ((present / attendanceLogs.length) * 100).toFixed(1)
            : 0;

        const feeHistory = await Fee.find({ student_id: student._id }).sort({ month: -1 });
        const totalDue = feeHistory.reduce((sum, fee) => sum + fee.balance, 0);

        const examResults = await Result.find({ student_id: student._id })
            .populate('exam_id')
            .sort({ createdAt: -1 });

        res.json({
            student: {
                id: student._id,
                name: student.full_name,
                roll_no: student.roll_no,
                class_id: student.class_id,
                section_id: student.section_id,
                father_name: student.family_id?.father_name || student.father_name,
                father_mobile: student.family_id?.father_mobile || student.father_mobile,
                monthly_fee: student.monthly_fee
            },
            attendance: {
                present,
                absent,
                leave,
                total: attendanceLogs.length,
                percentage: attendancePercentage,
                recent_logs: attendanceLogs.slice(0, 10)
            },
            fees: {
                total_due: totalDue,
                history: feeHistory
            },
            exams: examResults.map(result => ({
                exam_title: result.exam_id.title,
                percentage: result.percentage,
                grade: result.grade,
                total_obtained: result.total_obtained,
                total_max: result.total_max
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Daily Collection Report
// @route   GET /api/reports/daily-collection?date=YYYY-MM-DD
router.get('/daily-collection', protect, async (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const payments = await Fee.find({
            school_id: req.user.school_id,
            payment_date: { $gte: queryDate, $lt: nextDay }
        }).populate('student_id');

        const totalCollection = payments.reduce((sum, fee) => sum + fee.paid_amount, 0);
        const totalTransactions = payments.length;

        const breakdown = payments.map(fee => ({
            student_name: fee.student_id?.full_name,
            roll_no: fee.student_id?.roll_no,
            class_id: fee.student_id?.class_id,
            month: fee.month,
            amount: fee.paid_amount,
            status: fee.status,
            time: fee.payment_date
        }));

        res.json({
            date: queryDate,
            total_collection: totalCollection,
            total_transactions: totalTransactions,
            breakdown
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Exam Analysis Report
// @route   GET /api/reports/exam-analysis/:exam_id
router.get('/exam-analysis/:exam_id', protect, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.exam_id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const results = await Result.find({ exam_id: req.params.exam_id })
            .populate('student_id');

        const subjectAnalysis = {};

        results.forEach(result => {
            result.subjects.forEach(subject => {
                if (!subjectAnalysis[subject.subject_name]) {
                    subjectAnalysis[subject.subject_name] = {
                        total_students: 0,
                        total_marks: 0,
                        obtained_marks: 0,
                        passed: 0,
                        failed: 0
                    };
                }

                const analysis = subjectAnalysis[subject.subject_name];
                analysis.total_students++;
                analysis.total_marks += subject.total_marks;
                analysis.obtained_marks += subject.obtained_marks;

                if (subject.obtained_marks >= 33) {
                    analysis.passed++;
                } else {
                    analysis.failed++;
                }
            });
        });

        Object.keys(subjectAnalysis).forEach(subject => {
            const analysis = subjectAnalysis[subject];
            analysis.average_percentage = ((analysis.obtained_marks / analysis.total_marks) * 100).toFixed(2);
            analysis.pass_percentage = ((analysis.passed / analysis.total_students) * 100).toFixed(1);
        });

        res.json({
            exam_title: exam.title,
            total_students: results.length,
            subject_analysis: subjectAnalysis
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
