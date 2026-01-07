const express = require('express');
const router = express.Router();
const FeeHead = require('../models/FeeHead');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Get all Fee Heads (Fund Types)
// @route   GET /api/funds/heads
router.get('/heads', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const heads = await FeeHead.find({ tenant_id: req.tenant_id }).sort({ name: 1 });
        res.json(heads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a Fee Head
// @route   POST /api/funds/heads
router.post('/heads', protect, checkPermission('fees.create'), async (req, res) => {
    try {
        const {
            name,
            default_amount,
            category,
            description,
            is_optional,
            requires_enrollment,
            color
        } = req.body;

        const existing = await FeeHead.findOne({ tenant_id: req.tenant_id, name });
        if (existing) return res.status(400).json({ message: 'Fund name already exists' });

        const head = await FeeHead.create({
            tenant_id: req.tenant_id,
            name,
            default_amount: default_amount || 0,
            category: category || 'other',
            description,
            is_optional: is_optional || false,
            requires_enrollment: requires_enrollment || false,
            color: color || '#3B82F6'
        });

        res.status(201).json(head);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a Fee Head
// @route   DELETE /api/funds/heads/:id
router.delete('/heads/:id', protect, checkPermission('fees.delete'), async (req, res) => {
    try {
        await FeeHead.findOneAndDelete({ _id: req.params.id, tenant_id: req.tenant_id });
        res.json({ message: 'Fund type deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Generate Funds for a Class
// @route   POST /api/funds/generate
router.post('/generate', protect, checkPermission('fees.create'), async (req, res) => {
    try {
        const { class_id, section_id, fee_head_id, amount, month_reference } = req.body;

        if (!class_id || !fee_head_id || !month_reference) {
            return res.status(400).json({ message: 'Please provide Class, Fund Type, and Reference (Month)' });
        }

        const head = await FeeHead.findById(fee_head_id);
        if (!head) return res.status(404).json({ message: 'Fund Type not found' });

        // Find active students
        const query = {
            tenant_id: req.tenant_id,
            is_active: true,
            class_id: class_id
        };
        if (section_id && section_id !== 'All') query.section_id = section_id;
        // Session filter
        if (req.session_id) query.current_session_id = req.session_id;

        const students = await Student.find(query);

        if (students.length === 0) return res.status(404).json({ message: 'No students found in this class' });

        const results = { created: 0, skipped: 0, errors: 0 };

        for (const student of students) {
            try {
                // Check if already exists
                const exists = await Fee.findOne({
                    tenant_id: req.tenant_id,
                    student_id: student._id,
                    month: month_reference
                });

                if (exists) {
                    results.skipped++;
                    continue;
                }

                await Fee.create({
                    tenant_id: req.tenant_id,
                    school_id: student.school_id,
                    student_id: student._id,
                    session_id: req.session_id,
                    month: month_reference,
                    fee_type: 'Fund',
                    title: head.name,
                    tuition_fee: Number(amount) || 0,
                    gross_amount: Number(amount) || 0,
                    final_amount: Number(amount) || 0,
                    balance: Number(amount) || 0,
                    status: 'Pending'
                });

                results.created++;
            } catch (err) {
                console.error(err);
                results.errors++;
            }
        }

        res.json({
            message: `Fund generation complete. Created: ${results.created}, Skipped: ${results.skipped}`,
            results
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Fund Collection Report via FeeHead Name or Title
// @route   GET /api/funds/report/:title
router.get('/report', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const { title, month } = req.query; // Filter by Title (Fund Name) and optionally Month(Reference)

        if (!title) return res.status(400).json({ message: "Fund Title required" });

        const query = {
            tenant_id: req.tenant_id,
            fee_type: 'Fund', // Only funds
            title: title
        };

        if (month) query.month = month;
        if (req.session_id) query.session_id = req.session_id;

        const fees = await Fee.find(query)
            .populate('student_id', 'full_name roll_no class_id section_id')
            .sort({ 'student_id.class_id': 1, 'student_id.roll_no': 1 });

        const stats = {
            total_students: fees.length,
            paid_count: 0,
            unpaid_count: 0,
            total_amount: 0,
            collected_amount: 0,
            pending_amount: 0
        };

        const details = fees.map(f => {
            const isPaid = f.status === 'Paid';
            if (isPaid) stats.paid_count++; else stats.unpaid_count++;

            stats.total_amount += (f.gross_amount || 0);
            stats.collected_amount += (f.paid_amount || 0);
            stats.pending_amount += (f.balance || 0);

            return {
                student: f.student_id,
                amount: f.gross_amount,
                paid: f.paid_amount,
                balance: f.balance,
                status: f.status,
                month: f.month,
                title: f.title,
                date: f.payment_date
            };
        });

        res.json({ stats, details });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
