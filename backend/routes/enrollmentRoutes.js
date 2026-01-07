const express = require('express');
const router = express.Router();
const StudentEnrollment = require('../models/StudentEnrollment');
const FeeHead = require('../models/FeeHead');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Get enrollments for a student
// @route   GET /api/enrollments/student/:student_id
router.get('/student/:student_id', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const enrollments = await StudentEnrollment.find({
            tenant_id: req.tenant_id,
            student_id: req.params.student_id
        })
            .populate('fee_head_id', 'name category default_amount color')
            .populate('enrolled_by', 'name')
            .sort({ enrollment_date: -1 });

        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get students enrolled in a club/society/transport
// @route   GET /api/enrollments/fee-head/:fee_head_id
router.get('/fee-head/:fee_head_id', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const { is_active } = req.query;

        const query = {
            tenant_id: req.tenant_id,
            fee_head_id: req.params.fee_head_id
        };

        if (is_active !== undefined) {
            query.is_active = is_active === 'true';
        }

        const enrollments = await StudentEnrollment.find(query)
            .populate('student_id', 'full_name roll_no class_id section_id')
            .populate('enrolled_by', 'name')
            .sort({ enrollment_date: -1 });

        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all active enrollments (for fee generation)
// @route   GET /api/enrollments/active
router.get('/active', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const enrollments = await StudentEnrollment.find({
            tenant_id: req.tenant_id,
            is_active: true
        })
            .populate('student_id', 'full_name roll_no class_id section_id')
            .populate('fee_head_id', 'name category default_amount');

        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Enroll student(s) in club/society/transport
// @route   POST /api/enrollments
router.post('/', protect, checkPermission('fees.create'), async (req, res) => {
    try {
        const {
            student_ids, // Array for bulk enrollment
            fee_head_id,
            monthly_fee,
            notes,
            enrollment_date
        } = req.body;

        if (!student_ids || student_ids.length === 0) {
            return res.status(400).json({ message: 'Please select at least one student' });
        }

        if (!fee_head_id) {
            return res.status(400).json({ message: 'Please select a club/society/transport' });
        }

        // Verify fee head exists and requires enrollment
        const feeHead = await FeeHead.findOne({ _id: fee_head_id, tenant_id: req.tenant_id });
        if (!feeHead) {
            return res.status(404).json({ message: 'Club/Society/Transport not found' });
        }

        if (!feeHead.requires_enrollment) {
            return res.status(400).json({ message: 'This fee head does not require enrollment' });
        }

        const created = [];
        const errors = [];

        for (const student_id of student_ids) {
            try {
                // Check if already enrolled
                const existing = await StudentEnrollment.findOne({
                    tenant_id: req.tenant_id,
                    student_id,
                    fee_head_id,
                    is_active: true
                });

                if (existing) {
                    errors.push({ student_id, message: 'Already enrolled' });
                    continue;
                }

                // Verify student exists
                const student = await Student.findOne({ _id: student_id, tenant_id: req.tenant_id });
                if (!student) {
                    errors.push({ student_id, message: 'Student not found' });
                    continue;
                }

                const enrollment = await StudentEnrollment.create({
                    tenant_id: req.tenant_id,
                    student_id,
                    fee_head_id,
                    monthly_fee: monthly_fee || feeHead.default_amount,
                    notes,
                    enrollment_date: enrollment_date || new Date(),
                    enrolled_by: req.user._id
                });

                created.push(enrollment);
            } catch (err) {
                errors.push({ student_id, message: err.message });
            }
        }

        res.status(201).json({
            message: `Enrolled ${created.length} student(s)`,
            created: created.length,
            errors: errors.length,
            data: created,
            errorDetails: errors
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update enrollment
// @route   PUT /api/enrollments/:id
router.put('/:id', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const { monthly_fee, notes, end_date } = req.body;

        const enrollment = await StudentEnrollment.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        if (monthly_fee !== undefined) enrollment.monthly_fee = monthly_fee;
        if (notes !== undefined) enrollment.notes = notes;
        if (end_date !== undefined) enrollment.end_date = end_date;

        await enrollment.save();
        res.json(enrollment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Deactivate enrollment (un-enroll student)
// @route   PATCH /api/enrollments/:id/deactivate
router.patch('/:id/deactivate', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const enrollment = await StudentEnrollment.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        enrollment.is_active = false;
        enrollment.end_date = new Date();
        await enrollment.save();

        res.json({ message: 'Student un-enrolled successfully', enrollment });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reactivate enrollment
// @route   PATCH /api/enrollments/:id/activate
router.patch('/:id/activate', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const enrollment = await StudentEnrollment.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        enrollment.is_active = true;
        enrollment.end_date = null;
        await enrollment.save();

        res.json({ message: 'Enrollment reactivated successfully', enrollment });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
router.delete('/:id', protect, checkPermission('fees.delete'), async (req, res) => {
    try {
        const enrollment = await StudentEnrollment.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        await enrollment.deleteOne();
        res.json({ message: 'Enrollment deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get enrollment statistics
// @route   GET /api/enrollments/stats
router.get('/stats', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const enrollments = await StudentEnrollment.find({
            tenant_id: req.tenant_id,
            is_active: true
        }).populate('fee_head_id', 'name category');

        // Group by fee head
        const byFeeHead = {};
        enrollments.forEach(e => {
            const key = e.fee_head_id._id.toString();
            if (!byFeeHead[key]) {
                byFeeHead[key] = {
                    fee_head: e.fee_head_id,
                    enrolled_count: 0,
                    total_monthly_revenue: 0
                };
            }
            byFeeHead[key].enrolled_count++;
            byFeeHead[key].total_monthly_revenue += e.monthly_fee || e.fee_head_id.default_amount || 0;
        });

        res.json({
            total_active_enrollments: enrollments.length,
            by_fee_head: Object.values(byFeeHead)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
