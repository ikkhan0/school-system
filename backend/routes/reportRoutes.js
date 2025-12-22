const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Staff = require('../models/Staff');

// Student Reports
router.get('/students', async (req, res) => {
    try {
        const { type, class_id, section_id, status } = req.query;
        let query = {};

        if (class_id) query.class_id = class_id;
        if (section_id) query.section_id = section_id;
        if (status) query.status = status;

        if (type === 'list') {
            const students = await Student.find(query).select('roll_no full_name father_name father_mobile class_id section_id admission_date status');
            const formatted = students.map(s => ({
                'Roll No': s.roll_no,
                'Name': s.full_name,
                'Father Name': s.father_name,
                'Mobile': s.father_mobile,
                'Class': `${s.class_id}-${s.section_id}`,
                'Admission Date': s.admission_date ? new Date(s.admission_date).toLocaleDateString() : '-',
                'Status': s.status
            }));
            res.json(formatted);
        } else if (type === 'classwise') {
            const students = await Student.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: { class: '$class_id', section: '$section_id' },
                        count: { $sum: 1 },
                        active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
                        inactive: { $sum: { $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0] } }
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
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fee Reports
router.get('/fees', async (req, res) => {
    try {
        const { type, start_date, end_date, class_id, month } = req.query;

        if (type === 'collection') {
            let query = {};
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
            const defaulters = await Fee.find({ status: { $ne: 'Paid' } }).populate('student_id', 'roll_no full_name father_mobile class_id section_id');
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
                { $match: month ? { month } : {} },
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
router.get('/attendance', async (req, res) => {
    try {
        const { type, start_date, end_date, class_id, section_id } = req.query;

        if (type === 'daily') {
            let query = {};
            if (start_date) query.date = { $gte: new Date(start_date) };
            if (class_id) query.class_id = class_id;
            if (section_id) query.section_id = section_id;

            const attendance = await Attendance.find(query).populate('student_id', 'roll_no full_name class_id section_id');
            const formatted = attendance.map(a => ({
                'Date': new Date(a.date).toLocaleDateString(),
                'Roll No': a.student_id?.roll_no || '-',
                'Student': a.student_id?.full_name || '-',
                'Class': a.student_id ? `${a.student_id.class_id}-${a.student_id.section_id}` : '-',
                'Status': a.status
            }));
            res.json(formatted);
        } else if (type === 'monthly') {
            const attendance = await Attendance.aggregate([
                {
                    $match: {
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
            const attendance = await Attendance.aggregate([
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
router.get('/exams', async (req, res) => {
    try {
        const { type, class_id } = req.query;

        if (type === 'performance') {
            let query = {};
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
router.get('/staff', async (req, res) => {
    try {
        const { type, start_date, end_date } = req.query;

        if (type === 'list') {
            const staff = await Staff.find();
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
            // Note: This assumes you have a StaffAttendance model
            // If not, this will return empty array
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
