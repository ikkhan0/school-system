const express = require('express');
const router = express.Router();
const StudentCustomFee = require('../models/StudentCustomFee');
const FeeHead = require('../models/FeeHead');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Get all custom fees for a student
// @route   GET /api/student-fees/student/:student_id
router.get('/student/:student_id', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const fees = await StudentCustomFee.find({
            tenant_id: req.tenant_id,
            student_id: req.params.student_id
        })
            .populate('fee_head_id', 'name category color')
            .populate('applied_by', 'name')
            .sort({ applied_date: -1 });

        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all pending custom fees for voucher generation
// @route   GET /api/student-fees/pending
router.get('/pending', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const { student_id, month } = req.query;

        const query = {
            tenant_id: req.tenant_id,
            status: 'Pending'
        };

        if (student_id) query.student_id = student_id;
        if (month) query.applied_to_month = month;

        const fees = await StudentCustomFee.find(query)
            .populate('student_id', 'full_name roll_no class_id section_id')
            .populate('fee_head_id', 'name category')
            .sort({ applied_date: -1 });

        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Apply custom fee to student(s)
// @route   POST /api/student-fees
router.post('/', protect, checkPermission('fees.create'), async (req, res) => {
    try {
        const {
            student_ids, // Array of student IDs for bulk
            fee_head_id,
            amount,
            description,
            reason,
            applied_to_month,
            is_recurring,
            recurrence_frequency,
            end_date
        } = req.body;

        if (!student_ids || student_ids.length === 0) {
            return res.status(400).json({ message: 'Please select at least one student' });
        }

        if (!fee_head_id || !amount) {
            return res.status(400).json({ message: 'Fee head and amount are required' });
        }

        // Verify fee head exists
        const feeHead = await FeeHead.findOne({ _id: fee_head_id, tenant_id: req.tenant_id });
        if (!feeHead) {
            return res.status(404).json({ message: 'Fee head not found' });
        }

        const created = [];
        const errors = [];

        for (const student_id of student_ids) {
            try {
                // Verify student exists
                const student = await Student.findOne({ _id: student_id, tenant_id: req.tenant_id });
                if (!student) {
                    errors.push({ student_id, message: 'Student not found' });
                    continue;
                }

                const customFee = await StudentCustomFee.create({
                    tenant_id: req.tenant_id,
                    student_id,
                    fee_head_id,
                    amount: Number(amount),
                    description,
                    reason,
                    applied_to_month: applied_to_month || 'One-time',
                    is_recurring: is_recurring || false,
                    recurrence_frequency: recurrence_frequency || 'One-time',
                    end_date,
                    applied_by: req.user._id,
                    balance: Number(amount)
                });

                created.push(customFee);
            } catch (err) {
                errors.push({ student_id, message: err.message });
            }
        }

        res.status(201).json({
            message: `Applied fee to ${created.length} student(s)`,
            created: created.length,
            errors: errors.length,
            data: created,
            errorDetails: errors
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update custom fee
// @route   PUT /api/student-fees/:id
router.put('/:id', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const { amount, description, reason, applied_to_month, status } = req.body;

        const fee = await StudentCustomFee.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!fee) {
            return res.status(404).json({ message: 'Fee not found' });
        }

        // Only allow updates if not paid
        if (fee.status === 'Paid') {
            return res.status(400).json({ message: 'Cannot update paid fee' });
        }

        if (amount !== undefined) fee.amount = amount;
        if (description !== undefined) fee.description = description;
        if (reason !== undefined) fee.reason = reason;
        if (applied_to_month !== undefined) fee.applied_to_month = applied_to_month;
        if (status !== undefined) fee.status = status;

        await fee.save();
        res.json(fee);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Waive custom fee
// @route   PATCH /api/student-fees/:id/waive
router.patch('/:id/waive', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const { waiver_reason } = req.body;

        const fee = await StudentCustomFee.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!fee) {
            return res.status(404).json({ message: 'Fee not found' });
        }

        if (fee.status === 'Paid') {
            return res.status(400).json({ message: 'Cannot waive paid fee' });
        }

        fee.status = 'Waived';
        fee.waived_by = req.user._id;
        fee.waived_date = new Date();
        fee.waiver_reason = waiver_reason;

        await fee.save();
        res.json({ message: 'Fee waived successfully', fee });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete custom fee
// @route   DELETE /api/student-fees/:id
router.delete('/:id', protect, checkPermission('fees.delete'), async (req, res) => {
    try {
        const fee = await StudentCustomFee.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!fee) {
            return res.status(404).json({ message: 'Fee not found' });
        }

        // Only allow deletion if not paid
        if (fee.status === 'Paid') {
            return res.status(400).json({ message: 'Cannot delete paid fee. Please waive it instead.' });
        }

        await fee.deleteOne();
        res.json({ message: 'Fee deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get custom fees report
// @route   GET /api/student-fees/report
router.get('/report', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const { fee_head_id, status, start_date, end_date, class_id, section_id } = req.query;

        const query = { tenant_id: req.tenant_id };
        if (fee_head_id) query.fee_head_id = fee_head_id;
        if (status) query.status = status;
        if (start_date || end_date) {
            query.applied_date = {};
            if (start_date) query.applied_date.$gte = new Date(start_date);
            if (end_date) query.applied_date.$lte = new Date(end_date);
        }

        let fees = await StudentCustomFee.find(query)
            .populate('student_id', 'full_name roll_no class_id section_id')
            .populate('fee_head_id', 'name category')
            .populate('applied_by', 'name')
            .sort({ applied_date: -1 });

        // Filter by class/section if provided
        if (class_id) {
            fees = fees.filter(f => f.student_id?.class_id === class_id);
        }
        if (section_id) {
            fees = fees.filter(f => f.student_id?.section_id === section_id);
        }

        // Calculate statistics
        const stats = {
            total_fees: fees.length,
            total_amount: fees.reduce((sum, f) => sum + f.amount, 0),
            paid_amount: fees.reduce((sum, f) => sum + f.paid_amount, 0),
            pending_amount: fees.reduce((sum, f) => sum + (f.status === 'Pending' ? f.balance : 0), 0),
            by_status: {
                pending: fees.filter(f => f.status === 'Pending').length,
                paid: fees.filter(f => f.status === 'Paid').length,
                waived: fees.filter(f => f.status === 'Waived').length,
                cancelled: fees.filter(f => f.status === 'Cancelled').length
            }
        };

        res.json({ stats, fees });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
