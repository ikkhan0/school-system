const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const Student = require('../models/Student');
const DailyLog = require('../models/DailyLog');
const Fee = require('../models/Fee');
const Exam = require('../models/Exam');
const Result = require('../models/Result'); // Changed from ExamResult

// @desc    Get Fee Defaulters (Balance > 0)
// @route   GET /api/reports/defaulters
router.get('/defaulters', protect, checkPermission('reports.view'), async (req, res) => {
    try {
        const students = await Student.find({ is_active: true, tenant_id: req.tenant_id }).populate('family_id');

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
router.get('/shortage', protect, checkPermission('reports.view'), async (req, res) => {
    try {
        const students = await Student.find({ is_active: true, tenant_id: req.tenant_id }).populate('family_id');

        const shortage = [];
        for (const student of students) {
            const logs = await DailyLog.find({ student_id: student._id, tenant_id: req.tenant_id });
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
        console.log('📊 Attendance Summary Request:', req.query);
        const { start_date, end_date, class_id, section_id } = req.query;

        // Default to current month if no dates provided
        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
        const endDate = end_date ? new Date(end_date) : new Date();

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        console.log('📅 Date Range:', { startDate, endDate });

        let studentQuery = { tenant_id: req.tenant_id, is_active: true };
        if (class_id) studentQuery.class_id = class_id;
        if (section_id) studentQuery.section_id = section_id;

        console.log('🔍 Student Query:', studentQuery);

        const students = await Student.find(studentQuery).populate('family_id');
        console.log(`👥 Found ${students.length} students`);

        if (students.length === 0) {
            return res.json({
                start_date: startDate,
                end_date: endDate,
                total_students: 0,
                report: []
            });
        }

        const studentIds = students.map(s => s._id);

        const logs = await DailyLog.find({
            student_id: { $in: studentIds },
            date: { $gte: startDate, $lte: endDate },
            tenant_id: req.tenant_id
        });

        console.log(`📝 Found ${logs.length} attendance logs`);

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
                father_name: student.family_id?.father_name || student.father_name,
                father_mobile: student.family_id?.father_mobile || student.father_mobile,
                present,
                absent,
                leave,
                total,
                percentage: parseFloat(percentage)
            };
        });

        console.log(`✅ Attendance summary generated for ${report.length} students`);

        res.json({
            start_date: startDate,
            end_date: endDate,
            total_students: students.length,
            report
        });
    } catch (error) {
        console.error('❌ Error in attendance-summary:', error);
        res.status(500).json({ message: error.message, error: error.stack });
    }
});

// @desc    Get Detailed Day-wise Attendance Report
// @route   GET /api/reports/attendance-detailed?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&class_id=X&section_id=Y
router.get('/attendance-detailed', protect, async (req, res) => {
    try {
        console.log('📊 Detailed Attendance Request:', req.query);
        const { start_date, end_date, class_id, section_id } = req.query;

        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
        const endDate = end_date ? new Date(end_date) : new Date();

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        let studentQuery = { tenant_id: req.tenant_id, is_active: true };
        if (class_id) studentQuery.class_id = class_id;
        if (section_id) studentQuery.section_id = section_id;

        const students = await Student.find(studentQuery).populate('family_id');

        if (students.length === 0) {
            return res.json({
                start_date: startDate,
                end_date: endDate,
                logs: []
            });
        }

        const studentIds = students.map(s => s._id);

        // Fetch all logs for the period
        const logs = await DailyLog.find({
            student_id: { $in: studentIds },
            date: { $gte: startDate, $lte: endDate },
            tenant_id: req.tenant_id
        }).populate('student_id').sort({ date: -1, class_id: 1, section_id: 1 });

        // Format logs with student details
        const formattedLogs = logs.map(log => ({
            date: log.date,
            student_id: log.student_id._id,
            roll_no: log.student_id.roll_no,
            name: log.student_id.full_name,
            class_id: log.student_id.class_id,
            section_id: log.student_id.section_id,
            father_name: log.student_id.family_id?.father_name || log.student_id.father_name,
            father_mobile: log.student_id.family_id?.father_mobile || log.student_id.father_mobile,
            status: log.status,
            remarks: log.remarks || ''
        }));

        console.log(`✅ Found ${formattedLogs.length} detailed attendance records`);

        res.json({
            start_date: startDate,
            end_date: endDate,
            total_records: formattedLogs.length,
            logs: formattedLogs
        });
    } catch (error) {
        console.error('❌ Error in attendance-detailed:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Staff Attendance Report
// @route   GET /api/reports/staff-attendance?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get('/staff-attendance', protect, async (req, res) => {
    try {
        console.log('👔 Staff Attendance Request:', req.query);
        const { start_date, end_date, department, role } = req.query;
        const StaffAttendance = require('../models/StaffAttendance');
        const User = require('../models/User');

        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
        const endDate = end_date ? new Date(end_date) : new Date();

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Get all staff members
        let staffQuery = { school_id: req.tenant_id, role: { $in: ['Teacher', 'Staff', 'Admin'] } };
        if (role) staffQuery.role = role;

        const staffMembers = await User.find(staffQuery);
        const staffIds = staffMembers.map(s => s._id);

        // Get attendance logs
        const logs = await StaffAttendance.find({
            staff_id: { $in: staffIds },
            date: { $gte: startDate, $lte: endDate },
            school_id: req.tenant_id
        }).populate('staff_id');

        // Calculate summary for each staff member
        const report = staffMembers.map(staff => {
            const staffLogs = logs.filter(log => log.staff_id && log.staff_id._id.toString() === staff._id.toString());
            const present = staffLogs.filter(log => log.status === 'Present').length;
            const absent = staffLogs.filter(log => log.status === 'Absent').length;
            const leave = staffLogs.filter(log => log.status === 'Leave').length;
            const halfDay = staffLogs.filter(log => log.status === 'Half Day').length;
            const total = staffLogs.length;
            const percentage = total > 0 ? ((present + halfDay * 0.5) / total * 100).toFixed(1) : 0;

            return {
                staff_id: staff._id,
                name: staff.full_name,
                role: staff.role,
                mobile: staff.mobile,
                present,
                absent,
                leave,
                half_day: halfDay,
                total,
                percentage: parseFloat(percentage)
            };
        });

        // Also provide day-by-day logs
        const detailedLogs = logs.map(log => ({
            date: log.date,
            staff_id: log.staff_id._id,
            name: log.staff_id.full_name,
            role: log.staff_id.role,
            status: log.status,
            check_in: log.check_in,
            check_out: log.check_out,
            remarks: log.remarks || ''
        }));

        console.log(`✅ Staff attendance summary generated for ${report.length} staff members`);

        res.json({
            start_date: startDate,
            end_date: endDate,
            total_staff: staffMembers.length,
            summary: report,
            detailed_logs: detailedLogs
        });
    } catch (error) {
        console.error('❌ Error in staff-attendance:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Fee Defaulters Report (Enhanced)
// @route   GET /api/reports/fee-defaulters?days=30&class_id=X
router.get('/fee-defaulters', protect, async (req, res) => {
    try {
        const { days = 30, class_id } = req.query;
        const sessionId = req.session_id;

        let studentQuery = { tenant_id: req.tenant_id, is_active: true };
        if (class_id) studentQuery.class_id = class_id;
        if (sessionId) studentQuery.current_session_id = sessionId;

        const students = await Student.find(studentQuery).populate('family_id');

        const defaulters = [];

        for (const student of students) {
            // Query fees with session filter
            const feeQuery = {
                student_id: student._id,
                tenant_id: req.tenant_id,
                status: { $in: ['Pending', 'Partial'] },
                balance: { $gt: 0 } // Only fees with actual balance
            };
            if (sessionId) {
                feeQuery.session_id = sessionId;
            }

            const fees = await Fee.find(feeQuery).sort({ month: -1 });

            if (fees.length > 0) {
                const totalDue = fees.reduce((sum, fee) => sum + (fee.balance || 0), 0);

                // Only add if there's actually money due
                if (totalDue > 0) {
                    defaulters.push({
                        student_id: student._id,
                        name: student.full_name,
                        roll_no: student.roll_no,
                        class_id: student.class_id,
                        section_id: student.section_id,
                        father_mobile: student.family_id?.father_mobile || student.father_mobile,
                        total_due: Math.round(totalDue),
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

        let studentQuery = { tenant_id: req.tenant_id, is_active: true };
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

// @desc    Get Fee Collection Report (Daily or Date Range)
// @route   GET /api/reports/daily-collection?date=YYYY-MM-DD OR ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get('/daily-collection', protect, async (req, res) => {
    try {
        const { date, start_date, end_date } = req.query;
        let query = { tenant_id: req.tenant_id };

        if (start_date && end_date) {
            const startDate = new Date(start_date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(end_date);
            endDate.setHours(23, 59, 59, 999);

            query.payment_date = { $gte: startDate, $lte: endDate };
        } else {
            // Fallback to single date or today
            const queryDate = date ? new Date(date) : new Date();
            queryDate.setHours(0, 0, 0, 0);

            const nextDay = new Date(queryDate);
            nextDay.setDate(nextDay.getDate() + 1);

            query.payment_date = { $gte: queryDate, $lt: nextDay };
        }

        const payments = await Fee.find(query).populate('student_id').sort({ payment_date: -1 });

        const totalCollection = payments.reduce((sum, fee) => sum + fee.paid_amount, 0);
        const totalTransactions = payments.length;

        const breakdown = payments.map(fee => ({
            student_name: fee.student_id?.full_name || 'Deleted Student',
            roll_no: fee.student_id?.roll_no || 'N/A',
            class_id: fee.student_id?.class_id || '-',
            month: fee.month,
            amount: fee.paid_amount,
            status: fee.status,
            time: fee.payment_date
        }));

        res.json({
            date: date || start_date, // For display
            is_range: !!(start_date && end_date),
            start_date: start_date,
            end_date: end_date,
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

// Advanced Reporting Endpoints

// Student Reports
router.get('/students', protect, async (req, res) => {
    try {
        const { type, class_id, section_id, status } = req.query;
        let query = { tenant_id: req.tenant_id };

        if (class_id) query.class_id = class_id;
        if (section_id) query.section_id = section_id;
        if (status) query.is_active = status === 'Active';

        if (type === 'list') {
            const students = await Student.find(query).select('roll_no full_name father_name father_mobile class_id section_id admission_date is_active');
            const formatted = students.map(s => ({
                'Roll No': s.roll_no,
                'Name': s.full_name,
                'Father Name': s.father_name,
                'Mobile': s.father_mobile,
                'Class': `${s.class_id}-${s.section_id}`,
                'Admission Date': s.admission_date ? new Date(s.admission_date).toLocaleDateString() : '-',
                'Status': s.is_active ? 'Active' : 'Inactive'
            }));
            res.json(formatted);
        } else if (type === 'classwise') {
            const students = await Student.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: { class: '$class_id', section: '$section_id' },
                        count: { $sum: 1 },
                        active: { $sum: { $cond: ['$is_active', 1, 0] } },
                        inactive: { $sum: { $cond: ['$is_active', 0, 1] } }
                    }
                },
                { $sort: { '_id.class': 1, '_id.section': 1 } }
            ]);
            const formatted = students.map(s => ({
                'Class': s._id.class,
                'Section': s._id.section,
                'Total Students': s.count,
                'Active': s.active,
                'Inactive': s.inactive
            }));
            res.json(formatted);
        } else if (type === 'custom') {
            const { fields } = req.query;
            const fieldsToSelect = fields ? fields.split(',').join(' ') : 'roll_no full_name father_name class_id section_id';

            const students = await Student.find(query).select(fieldsToSelect);

            // Map Mongoose documents to flat objects with readable keys
            const fieldLabels = {
                roll_no: 'Roll No',
                full_name: 'Name',
                father_name: 'Father Name',
                class_id: 'Class',
                section_id: 'Section',
                father_mobile: 'Father Mobile',
                student_mobile: 'Student Mobile',
                admission_date: 'Admission Date',
                monthly_fee: 'Monthly Fee',
                status: 'Status',
                gender: 'Gender',
                dob: 'Date of Birth',
                address: 'Address',
                city: 'City',
                blood_group: 'Blood Group',
                religion: 'Religion',
                cnic: 'B-Form/CNIC',
                father_cnic: 'Father CNIC'
            };

            const formatted = students.map(student => {
                const doc = student.toObject();
                const currentRow = {};

                // Only include requested fields
                const requestedFields = fields ? fields.split(',') : Object.keys(fieldLabels);

                requestedFields.forEach(field => {
                    let value = doc[field];
                    if (field === 'admission_date' || field === 'dob') {
                        value = value ? new Date(value).toLocaleDateString() : '-';
                    }
                    currentRow[fieldLabels[field] || field] = value || '-';
                });
                return currentRow;
            });

            res.json(formatted);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fee Reports
router.get('/fees', protect, async (req, res) => {
    try {
        const { type, start_date, end_date, class_id, month } = req.query;

        if (type === 'collection') {
            let query = { tenant_id: req.tenant_id };
            if (start_date && end_date) {
                query.payment_date = { $gte: new Date(start_date), $lte: new Date(end_date) };
            }
            if (class_id) query.class_id = class_id;

            const fees = await Fee.find(query).populate('student_id', 'roll_no full_name class_id section_id');
            const formatted = fees.map(f => ({
                'Date': f.payment_date ? new Date(f.payment_date).toLocaleDateString() : '-',
                'Roll No': f.student_id?.roll_no || '-',
                'Student': f.student_id?.full_name || '-',
                'Class': f.student_id ? `${f.student_id.class_id}-${f.student_id.section_id}` : '-',
                'Month': f.month,
                'Amount': f.paid_amount,
                'Status': f.status
            }));
            res.json(formatted);
        } else if (type === 'defaulters') {
            const defaulters = await Fee.find({ tenant_id: req.tenant_id, status: { $ne: 'Paid' } }).populate('student_id', 'roll_no full_name father_mobile class_id section_id');
            const formatted = defaulters.map(f => ({
                'Roll No': f.student_id?.roll_no || '-',
                'Student': f.student_id?.full_name || '-',
                'Class': f.student_id ? `${f.student_id.class_id}-${f.student_id.section_id}` : '-',
                'Mobile': f.student_id?.father_mobile || '-',
                'Month': f.month,
                'Due Amount': f.balance,
                'Status': f.status
            }));
            res.json(formatted);
        } else if (type === 'monthly') {
            const fees = await Fee.aggregate([
                { $match: month ? { month, tenant_id: req.tenant_id } : { tenant_id: req.tenant_id } },
                {
                    $group: {
                        _id: '$month',
                        total_due: { $sum: '$gross_amount' },
                        total_collected: { $sum: '$paid_amount' },
                        total_pending: { $sum: '$balance' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: -1 } }
            ]);
            const formatted = fees.map(f => ({
                'Month': f._id,
                'Total Students': f.count,
                'Total Due': f.total_due,
                'Collected': f.total_collected,
                'Pending': f.total_pending,
                'Collection %': ((f.total_collected / f.total_due) * 100).toFixed(1)
            }));
            res.json(formatted);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Attendance Reports
router.get('/attendance', protect, async (req, res) => {
    try {
        const { type, start_date, end_date, class_id, section_id } = req.query;

        if (type === 'daily') {
            let query = { tenant_id: req.tenant_id };
            if (start_date) query.date = { $gte: new Date(start_date) };
            if (class_id) query.class_id = class_id;
            if (section_id) query.section_id = section_id;

            const attendance = await DailyLog.find(query).populate('student_id', 'roll_no full_name class_id section_id');
            const formatted = attendance.map(a => ({
                'Date': new Date(a.date).toLocaleDateString(),
                'Roll No': a.student_id?.roll_no || '-',
                'Student': a.student_id?.full_name || '-',
                'Class': a.student_id ? `${a.student_id.class_id}-${a.student_id.section_id}` : '-',
                'Status': a.status
            }));
            res.json(formatted);
        } else if (type === 'monthly') {
            const attendance = await DailyLog.aggregate([
                {
                    $match: {
                        tenant_id: req.tenant_id,
                        date: { $gte: new Date(start_date), $lte: new Date(end_date) }
                    }
                },
                {
                    $group: {
                        _id: '$student_id',
                        present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                        absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                        leave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
                        total: { $sum: 1 }
                    }
                }
            ]);

            const students = await Student.find({ _id: { $in: attendance.map(a => a._id) } });
            const formatted = attendance.map(a => {
                const student = students.find(s => s._id.toString() === a._id.toString());
                const percentage = ((a.present / a.total) * 100).toFixed(1);
                return {
                    'Roll No': student?.roll_no || '-',
                    'Student': student?.full_name || '-',
                    'Class': student ? `${student.class_id}-${student.section_id}` : '-',
                    'Present': a.present,
                    'Absent': a.absent,
                    'Leave': a.leave,
                    'Total Days': a.total,
                    'Attendance %': percentage
                };
            });
            res.json(formatted);
        } else if (type === 'low') {
            const attendance = await DailyLog.aggregate([
                { $match: { tenant_id: req.tenant_id } },
                {
                    $group: {
                        _id: '$student_id',
                        present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                        total: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        present: 1,
                        total: 1,
                        percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
                    }
                },
                { $match: { percentage: { $lt: 75 } } }
            ]);

            const students = await Student.find({ _id: { $in: attendance.map(a => a._id) } });
            const formatted = attendance.map(a => {
                const student = students.find(s => s._id.toString() === a._id.toString());
                return {
                    'Roll No': student?.roll_no || '-',
                    'Student': student?.full_name || '-',
                    'Class': student ? `${student.class_id}-${student.section_id}` : '-',
                    'Mobile': student?.father_mobile || '-',
                    'Present': a.present,
                    'Total Days': a.total,
                    'Attendance %': a.percentage.toFixed(1)
                };
            });
            res.json(formatted);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Exam Reports
router.get('/exams', protect, async (req, res) => {
    try {
        const { type, class_id } = req.query;

        if (type === 'performance') {
            let query = { tenant_id: req.tenant_id };
            if (class_id) query.class_id = class_id;

            const results = await Result.find(query).populate('student_id', 'roll_no full_name class_id section_id').populate('exam_id', 'title');
            const formatted = results.map(r => ({
                'Exam': r.exam_id?.title || '-',
                'Roll No': r.student_id?.roll_no || '-',
                'Student': r.student_id?.full_name || '-',
                'Class': r.student_id ? `${r.student_id.class_id}-${r.student_id.section_id}` : '-',
                'Total Obtained': r.total_obtained,
                'Total Marks': r.total_max,
                'Percentage': r.percentage.toFixed(2),
                'Grade': r.grade
            }));
            res.json(formatted);
        } else if (type === 'progress') {
            const results = await Result.aggregate([
                { $match: { tenant_id: req.tenant_id } },
                {
                    $group: {
                        _id: '$student_id',
                        exams: { $sum: 1 },
                        avg_percentage: { $avg: '$percentage' },
                        highest: { $max: '$percentage' },
                        lowest: { $min: '$percentage' }
                    }
                }
            ]);

            const students = await Student.find({ _id: { $in: results.map(r => r._id) } });
            const formatted = results.map(r => {
                const student = students.find(s => s._id.toString() === r._id.toString());
                return {
                    'Roll No': student?.roll_no || '-',
                    'Student': student?.full_name || '-',
                    'Class': student ? `${student.class_id}-${student.section_id}` : '-',
                    'Exams Taken': r.exams,
                    'Average %': r.avg_percentage.toFixed(2),
                    'Highest %': r.highest.toFixed(2),
                    'Lowest %': r.lowest.toFixed(2)
                };
            });
            res.json(formatted);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Staff Reports
const Staff = require('../models/Staff');
router.get('/staff', protect, async (req, res) => {
    try {
        const { type } = req.query;

        if (type === 'list') {
            const staff = await Staff.find({ tenant_id: req.tenant_id });
            const formatted = staff.map(s => ({
                'Name': s.full_name,
                'Designation': s.designation,
                'Department': s.department || '-',
                'Mobile': s.mobile,
                'Email': s.email || '-',
                'Joining Date': s.joining_date ? new Date(s.joining_date).toLocaleDateString() : '-',
                'Salary': s.salary || '-'
            }));
            res.json(formatted);
        } else if (type === 'attendance') {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Students with 3+ Consecutive Absences
// @route   GET /api/reports/consecutive-absences
router.get('/consecutive-absences', protect, async (req, res) => {
    try {
        const students = await Student.find({ is_active: true, tenant_id: req.tenant_id }).populate('family_id');
        const consecutiveAbsences = [];

        for (const student of students) {
            // Get last 30 days of attendance logs
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const logs = await DailyLog.find({
                student_id: student._id,
                tenant_id: req.tenant_id,
                date: { $gte: thirtyDaysAgo }
            }).sort({ date: -1 });

            // Check for consecutive absences
            let consecutiveCount = 0;
            let maxConsecutive = 0;
            let consecutiveDates = [];

            for (const log of logs) {
                if (log.status === 'Absent') {
                    consecutiveCount++;
                    consecutiveDates.push(log.date);
                    if (consecutiveCount > maxConsecutive) {
                        maxConsecutive = consecutiveCount;
                    }
                } else {
                    if (consecutiveCount >= 3) {
                        break; // Found the consecutive streak
                    }
                    consecutiveCount = 0;
                    consecutiveDates = [];
                }
            }

            if (maxConsecutive >= 3) {
                consecutiveAbsences.push({
                    student_id: student._id,
                    name: student.full_name,
                    roll_no: student.roll_no,
                    class_id: student.class_id,
                    section_id: student.section_id,
                    father_name: student.family_id?.father_name || student.father_name,
                    father_mobile: student.family_id?.father_mobile || student.father_mobile,
                    consecutive_days: maxConsecutive,
                    last_absent_date: consecutiveDates[0]
                });
            }
        }

        res.json({
            total_students: consecutiveAbsences.length,
            students: consecutiveAbsences
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
