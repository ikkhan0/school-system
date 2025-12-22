const express = require('express');
const router = express.Router();
const DiscountPolicy = require('../models/DiscountPolicy');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// @route   POST /api/discounts/policy
// @desc    Create a new discount policy
// @access  Private
router.post('/policy', protect, async (req, res) => {
    try {
        const policy = new DiscountPolicy({
            ...req.body,
            school_id: req.user.school_id,
            created_by: req.user._id
        });

        await policy.save();
        res.status(201).json(policy);
    } catch (error) {
        console.error('Error creating discount policy:', error);
        res.status(500).json({ message: 'Failed to create discount policy', error: error.message });
    }
});

// @route   GET /api/discounts/policies
// @desc    Get all discount policies for school
// @access  Private
router.get('/policies', protect, async (req, res) => {
    try {
        const { active_only } = req.query;

        const query = { school_id: req.user.school_id };
        if (active_only === 'true') {
            query.is_active = true;
        }

        const policies = await DiscountPolicy.find(query).sort({ policy_type: 1, createdAt: -1 });
        res.json(policies);
    } catch (error) {
        console.error('Error fetching discount policies:', error);
        res.status(500).json({ message: 'Failed to fetch discount policies', error: error.message });
    }
});

// @route   GET /api/discounts/policy/:id
// @desc    Get single discount policy
// @access  Private
router.get('/policy/:id', protect, async (req, res) => {
    try {
        const policy = await DiscountPolicy.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        });

        if (!policy) {
            return res.status(404).json({ message: 'Discount policy not found' });
        }

        res.json(policy);
    } catch (error) {
        console.error('Error fetching discount policy:', error);
        res.status(500).json({ message: 'Failed to fetch discount policy', error: error.message });
    }
});

// @route   PUT /api/discounts/policy/:id
// @desc    Update discount policy
// @access  Private
router.put('/policy/:id', protect, async (req, res) => {
    try {
        const policy = await DiscountPolicy.findOneAndUpdate(
            { _id: req.params.id, school_id: req.user.school_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!policy) {
            return res.status(404).json({ message: 'Discount policy not found' });
        }

        res.json(policy);
    } catch (error) {
        console.error('Error updating discount policy:', error);
        res.status(500).json({ message: 'Failed to update discount policy', error: error.message });
    }
});

// @route   DELETE /api/discounts/policy/:id
// @desc    Delete discount policy
// @access  Private
router.delete('/policy/:id', protect, async (req, res) => {
    try {
        const policy = await DiscountPolicy.findOneAndDelete({
            _id: req.params.id,
            school_id: req.user.school_id
        });

        if (!policy) {
            return res.status(404).json({ message: 'Discount policy not found' });
        }

        res.json({ message: 'Discount policy deleted successfully' });
    } catch (error) {
        console.error('Error deleting discount policy:', error);
        res.status(500).json({ message: 'Failed to delete discount policy', error: error.message });
    }
});

// @route   GET /api/discounts/calculate/:student_id
// @desc    Calculate applicable discounts for a student
// @access  Private
router.get('/calculate/:student_id', protect, async (req, res) => {
    try {
        const { fee_amount } = req.query;
        const amount = parseFloat(fee_amount) || 0;

        const student = await Student.findOne({
            _id: req.params.student_id,
            school_id: req.user.school_id
        }).populate('siblings');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const policies = await DiscountPolicy.find({
            school_id: req.user.school_id,
            is_active: true
        });

        let totalDiscount = 0;
        const appliedDiscounts = [];

        // Check each policy
        for (const policy of policies) {
            let applicable = false;
            let discountAmount = 0;

            switch (policy.policy_type) {
                case 'Staff Child':
                    if (student.discount_category === 'Staff Child') {
                        applicable = true;
                    }
                    break;

                case 'Sibling':
                    if (student.siblings && student.siblings.length > 0) {
                        applicable = true;
                    }
                    break;

                case 'Merit':
                    if (student.discount_category === 'Merit') {
                        applicable = true;
                    }
                    break;

                case 'Financial Aid':
                    if (student.discount_category === 'Financial Aid') {
                        applicable = true;
                    }
                    break;
            }

            if (applicable) {
                if (policy.discount_mode === 'Percentage') {
                    discountAmount = (amount * policy.discount_percentage) / 100;
                } else {
                    discountAmount = policy.discount_amount;
                }

                totalDiscount += discountAmount;
                appliedDiscounts.push({
                    policy_name: policy.policy_name,
                    policy_type: policy.policy_type,
                    discount_amount: discountAmount,
                    discount_percentage: policy.discount_percentage
                });
            }
        }

        res.json({
            student_id: student._id,
            student_name: student.full_name,
            original_amount: amount,
            total_discount: totalDiscount,
            final_amount: amount - totalDiscount,
            applied_discounts: appliedDiscounts
        });
    } catch (error) {
        console.error('Error calculating discounts:', error);
        res.status(500).json({ message: 'Failed to calculate discounts', error: error.message });
    }
});

module.exports = router;
