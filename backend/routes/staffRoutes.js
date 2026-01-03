const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const Staff = require('../models/Staff');
const StaffAttendance = require('../models/StaffAttendance');
const Salary = require('../models/Salary');
const multer = require('multer');
const path = require('path');

// Multer Config for staff photos
const { uploadToImgBB } = require('../config/imgbb');

// Multer Config for memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/; // Added more formats
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images Only! (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// ==================== STAFF MANAGEMENT ====================

// @desc    Add new staff member
// @route   POST /api/staff/add
router.post('/add', protect, checkPermission('staff.create'), upload.single('photo'), async (req, res) => {
    try {
        const { assigned_subjects, assigned_classes, ...staffData } = req.body;

        // Parse subjects and classes if they're strings
        let parsedSubjects = [];
        let parsedClasses = [];

        if (assigned_subjects) {
            try {
                parsedSubjects = Array.isArray(assigned_subjects)
                    ? assigned_subjects
                    : JSON.parse(assigned_subjects);
            } catch (e) {
                parsedSubjects = [];
            }
        }

        if (assigned_classes) {
            try {
                parsedClasses = Array.isArray(assigned_classes)
                    ? assigned_classes
                    : JSON.parse(assigned_classes);
            } catch (e) {
                parsedClasses = [];
            }
        }

        // Handle photo upload to ImgBB
        let photoUrl = '';
        if (req.file) {
            try {
                const base64Image = req.file.buffer.toString('base64');
                photoUrl = await uploadToImgBB(base64Image);
            } catch (uploadError) {
                console.error("ImgBB Upload Error:", uploadError);
                // Fallback or continue without image
            }
        }

        const staff = await Staff.create({
            ...staffData,
            photo: photoUrl,
            tenant_id: req.tenant_id,
            assigned_subjects: parsedSubjects.map(id => ({ subject_id: id })),
            assigned_classes: parsedClasses
        });

        res.status(201).json(staff);
    } catch (error) {
        console.error('Error adding staff:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get all staff members (alias for /list)
// @route   GET /api/staff
router.get('/', protect, checkPermission('staff.view'), async (req, res) => {
    try {
        const { designation, department, status } = req.query;

        let query = { tenant_id: req.tenant_id };

        if (designation) query.designation = designation;
        if (department) query.department = department;
        if (status) query.is_active = status === 'active';
        else query.is_active = true; // Default to active only

        const staff = await Staff.find(query)
            .populate('assigned_subjects.subject_id')
            .sort({ full_name: 1 });

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all staff members
// @route   GET /api/staff/list
router.get('/list', protect, checkPermission('staff.view'), async (req, res) => {
    try {
        const { designation, department, status } = req.query;

        let query = { tenant_id: req.tenant_id };

        if (designation) query.designation = designation;
        if (department) query.department = department;
        if (status) query.is_active = status === 'active';
        else query.is_active = true; // Default to active only

        const staff = await Staff.find(query)
            .populate('assigned_subjects.subject_id')
            .sort({ full_name: 1 });

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get staff member details
// @route   GET /api/staff/:id
router.get('/:id', protect, checkPermission('staff.view'), async (req, res) => {
    try {
        const staff = await Staff.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        }).populate('assigned_subjects.subject_id');

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update staff member
// @route   PUT /api/staff/:id
router.put('/:id', protect, checkPermission('staff.edit'), upload.single('photo'), async (req, res) => {
    try {
        const { assigned_subjects, assigned_classes, ...staffData } = req.body;

        const staff = await Staff.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        // Update basic fields
        Object.keys(staffData).forEach(key => {
            if (staffData[key] !== undefined && staffData[key] !== 'null' && staffData[key] !== '') {
                // Handle string "null" or empty if needed, or specific logic
                staff[key] = staffData[key];
            }
        });

        // Update photo if new file uploaded
        if (req.file) {
            try {
                const base64Image = req.file.buffer.toString('base64');
                const photoUrl = await uploadToImgBB(base64Image);
                staff.photo = photoUrl;
            } catch (uploadError) {
                console.error("ImgBB Upload Update Error:", uploadError);
            }
        }

        // Update subjects if provided
        if (assigned_subjects) {
            try {
                const parsedSubjects = Array.isArray(assigned_subjects)
                    ? assigned_subjects
                    : JSON.parse(assigned_subjects);
                staff.assigned_subjects = parsedSubjects.map(id => ({ subject_id: id }));
            } catch (e) { /* ignore JSON parse error */ }
        }

        // Update classes if provided
        if (assigned_classes) {
            try {
                const parsedClasses = Array.isArray(assigned_classes)
                    ? assigned_classes
                    : JSON.parse(assigned_classes);
                staff.assigned_classes = parsedClasses;
            } catch (e) { /* ignore */ }
        }

        await staff.save();

        const updatedStaff = await Staff.findById(staff._id)
            .populate('assigned_subjects.subject_id');

        res.json(updatedStaff);
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get staff profile (complete)
// @route   GET /api/staff/:id/profile
router.get('/:id/profile', protect, async (req, res) => {
    try {
        const staff = await Staff.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        }).populate('assigned_subjects.subject_id');

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== ATTENDANCE MANAGEMENT ====================

// @desc    Mark staff attendance
// @route   POST /api/staff/attendance/mark
router.post('/attendance/mark', protect, checkPermission('staff.edit'), async (req, res) => {
    try {
        const { attendanceRecords } = req.body;
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../debug_log.txt');

        const log = (msg) => {
            if (process.env.NODE_ENV !== 'production') {
                try {
                    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
                } catch (e) { console.log(msg); }
            }
        };

        log(`Attendance Request: user=${req.user?.username}, role=${req.user?.role}, tenant_id=${req.tenant_id}`);

        // Validate user and tenant context early
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const effectiveTenantId = req.tenant_id || req.user.tenant_id || req.user.school_id;
        if (!effectiveTenantId) {
            return res.status(400).json({ message: 'No tenant context found. Please contact administrator.' });
        }

        if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
            return res.status(400).json({ message: 'Invalid attendance records format' });
        }

        if (attendanceRecords.length === 0) {
            return res.status(400).json({ message: 'No attendance records provided' });
        }

        const results = [];

        for (const record of attendanceRecords) {
            if (!record.staff_id || !record.date || !record.status) {
                continue; // Skip invalid records
            }

            // Normalize date to ensure consistency (strip time)
            const attendanceDate = new Date(record.date);
            attendanceDate.setHours(0, 0, 0, 0);

            // Ensure tenant_id is always defined - use the same one for all records
            const tenantId = req.tenant_id || (req.user && (req.user.tenant_id || req.user.school_id || req.user._id));

            if (!tenantId) {
                log(`ERROR: No tenant_id available for record: ${record.staff_id}`);
                continue; // Skip this record if we can't determine tenant
            }

            log(`Processing record: staff=${record.staff_id}, date=${attendanceDate.toISOString()}, tenant=${tenantId}`);

            const existing = await StaffAttendance.findOne({
                tenant_id: tenantId,
                staff_id: record.staff_id,
                date: attendanceDate
            });

            if (existing) {
                // Update existing record
                const updateData = {
                    status: record.status,
                    check_in_time: record.check_in_time || undefined,
                    check_out_time: record.check_out_time || undefined,
                    notes: record.notes || undefined,
                    marked_by: req.user?._id
                };

                // Only include leave_type if status is Leave and it has a valid value
                if (record.status === 'Leave' && record.leave_type) {
                    updateData.leave_type = record.leave_type;
                } else {
                    updateData.leave_type = undefined;
                }

                Object.assign(existing, updateData);
                await existing.save();
                results.push(existing);
            } else {
                // Create new record
                const attendanceData = {
                    tenant_id: tenantId,
                    staff_id: record.staff_id,
                    date: attendanceDate,
                    status: record.status,
                    check_in_time: record.check_in_time || undefined,
                    check_out_time: record.check_out_time || undefined,
                    notes: record.notes || undefined,
                    marked_by: req.user?._id
                };

                // Only include leave_type if status is Leave and it has a valid value
                if (record.status === 'Leave' && record.leave_type) {
                    attendanceData.leave_type = record.leave_type;
                }

                const attendance = await StaffAttendance.create(attendanceData);
                results.push(attendance);
            }
        }

        res.status(201).json(results);
    } catch (error) {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../debug_log.txt');

        const errorDetails = {
            message: error.message,
            stack: error.stack,
            user: req.user?.username,
            tenant_id: req.tenant_id,
            recordCount: req.body?.attendanceRecords?.length
        };

        try {
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ATTENDANCE ERROR:\n${JSON.stringify(errorDetails, null, 2)}\n`);
        } catch (e) {
            console.log('Failed to write log:', e);
        }

        console.error('Attendance Save Error:', errorDetails);
        res.status(500).json({
            message: error.message || 'Server Error',
            details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
});

// @desc    Get daily attendance
// @route   GET /api/staff/attendance/daily?date=YYYY-MM-DD
router.get('/attendance/daily', protect, checkPermission('staff.view'), async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();

        // Set to start of day
        targetDate.setHours(0, 0, 0, 0);

        const attendance = await StaffAttendance.find({
            tenant_id: req.tenant_id,
            date: targetDate
        }).populate('staff_id', 'full_name employee_id designation photo');

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get monthly attendance report
// @route   GET /api/staff/attendance/monthly?month=Jan-2025
router.get('/attendance/monthly', protect, async (req, res) => {
    try {
        const { month, year } = req.query;

        const startDate = new Date(year, new Date(Date.parse(month + " 1, 2000")).getMonth(), 1);
        const endDate = new Date(year, new Date(Date.parse(month + " 1, 2000")).getMonth() + 1, 0);

        const attendance = await StaffAttendance.find({
            tenant_id: req.tenant_id,
            date: { $gte: startDate, $lte: endDate }
        }).populate('staff_id', 'full_name employee_id designation');

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get individual staff attendance summary
// @route   GET /api/staff/:id/attendance-summary?month=Jan&year=2025
router.get('/:id/attendance-summary', protect, async (req, res) => {
    try {
        const { month, year } = req.query;

        let query = {
            tenant_id: req.tenant_id,
            staff_id: req.params.id
        };

        if (month && year) {
            const startDate = new Date(year, new Date(Date.parse(month + " 1, 2000")).getMonth(), 1);
            const endDate = new Date(year, new Date(Date.parse(month + " 1, 2000")).getMonth() + 1, 0);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const records = await StaffAttendance.find(query);

        const summary = {
            total_days: records.length,
            present: records.filter(r => r.status === 'Present').length,
            absent: records.filter(r => r.status === 'Absent').length,
            leave: records.filter(r => r.status === 'Leave').length,
            half_day: records.filter(r => r.status === 'Half-Day').length,
            late: records.filter(r => r.status === 'Late').length
        };

        summary.percentage = summary.total_days > 0
            ? ((summary.present + summary.half_day * 0.5) / summary.total_days * 100).toFixed(2)
            : 0;

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== SALARY MANAGEMENT ====================

// @desc    Generate monthly salaries
// @route   POST /api/staff/salary/generate
router.post('/salary/generate', protect, async (req, res) => {
    try {
        const { month, year } = req.body;

        // Get all active staff
        const staffMembers = await Staff.find({
            tenant_id: req.tenant_id,
            is_active: true
        });

        const salaries = [];

        for (const staff of staffMembers) {
            // Check if salary already exists
            const existing = await Salary.findOne({
                tenant_id: req.tenant_id,
                staff_id: staff._id,
                month,
                year
            });

            if (existing) continue; // Skip if already generated

            // Calculate attendance-based deductions
            const startDate = new Date(year, new Date(Date.parse(month + " 1, 2000")).getMonth(), 1);
            const endDate = new Date(year, new Date(Date.parse(month + " 1, 2000")).getMonth() + 1, 0);

            const attendance = await StaffAttendance.find({
                tenant_id: req.tenant_id,
                staff_id: staff._id,
                date: { $gte: startDate, $lte: endDate }
            });

            const workingDays = endDate.getDate();
            const presentDays = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
            const halfDays = attendance.filter(a => a.status === 'Half-Day').length;
            const absentDays = attendance.filter(a => a.status === 'Absent').length;
            const leaveDays = attendance.filter(a => a.status === 'Leave').length;

            // Calculate salary
            const dailySalary = staff.basic_salary / workingDays;
            const absenceDeduction = (absentDays * dailySalary) + (halfDays * dailySalary * 0.5);

            const grossSalary = staff.basic_salary +
                (staff.allowances?.house_rent || 0) +
                (staff.allowances?.medical || 0) +
                (staff.allowances?.transport || 0) +
                (staff.allowances?.other || 0);

            const totalDeductions = absenceDeduction;
            const netSalary = grossSalary - totalDeductions;

            const salary = await Salary.create({
                tenant_id: req.tenant_id,
                staff_id: staff._id,
                month,
                year,
                basic_salary: staff.basic_salary,
                allowances: staff.allowances,
                deductions: {
                    absence: absenceDeduction
                },
                gross_salary: grossSalary,
                total_deductions: totalDeductions,
                net_salary: netSalary,
                working_days: workingDays,
                present_days: presentDays,
                absent_days: absentDays,
                leave_days: leaveDays,
                generated_by: req.user._id
            });

            salaries.push(salary);
        }

        res.status(201).json({
            message: `Generated ${salaries.length} salary records`,
            salaries
        });
    } catch (error) {
        console.error('Error generating salaries:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get salary records
// @route   GET /api/staff/salary/list?month=Jan&year=2025
router.get('/salary/list', protect, async (req, res) => {
    try {
        const { month, year, status } = req.query;

        let query = { tenant_id: req.tenant_id };

        if (month) query.month = month;
        if (year) query.year = parseInt(year);
        if (status) query.payment_status = status;

        const salaries = await Salary.find(query)
            .populate('staff_id', 'full_name employee_id designation')
            .sort({ createdAt: -1 });

        res.json(salaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get individual staff salary history
// @route   GET /api/staff/:id/salary-history
router.get('/:id/salary-history', protect, async (req, res) => {
    try {
        const salaries = await Salary.find({
            tenant_id: req.tenant_id,
            staff_id: req.params.id
        }).sort({ year: -1, month: -1 });

        res.json(salaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Mark salary as paid
// @route   PUT /api/staff/salary/:id/pay
router.put('/salary/:id/pay', protect, async (req, res) => {
    try {
        const { payment_method, payment_reference } = req.body;

        const salary = await Salary.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        salary.payment_status = 'Paid';
        salary.payment_date = new Date();
        salary.payment_method = payment_method;
        salary.payment_reference = payment_reference;

        await salary.save();

        res.json(salary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
