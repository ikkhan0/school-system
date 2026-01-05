const express = require('express');
const router = express.Router();
const DiscountPolicy = require('../models/DiscountPolicy');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const { calculateAutoDiscounts } = require('../utils/discountCalculator');
const {
    suggestSiblingGroups,
    linkSiblings,
    updateSiblingPositions,
    detectSiblingsByFamily,
    detectSiblingsByMobile
} = require('../utils/siblingDetector');

// @route   POST /api/discounts/policy
// @desc    Create a new discount policy
// @access  Private
router.post('/policy', protect, async (req, res) => {
    try {
        const policy = new DiscountPolicy({
            ...req.body,
            tenant_id: req.tenant_id,
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

        console.log('🔍 Fetching discount policies for tenant:', req.tenant_id);

        const query = { tenant_id: req.tenant_id };
        if (active_only === 'true') {
            query.is_active = true;
        }

        let policies = await DiscountPolicy.find(query).sort({ policy_type: 1, createdAt: -1 });

        // Fallback: If no policies found with tenant_id, try school_id (for backward compatibility)
        if (policies.length === 0) {
            console.log('⚠️ No policies found with tenant_id, trying school_id...');
            const fallbackQuery = { school_id: req.tenant_id };
            if (active_only === 'true') {
                fallbackQuery.is_active = true;
            }
            policies = await DiscountPolicy.find(fallbackQuery).sort({ policy_type: 1, createdAt: -1 });
            console.log(`✅ Found ${policies.length} policies with school_id`);
        } else {
            console.log(`✅ Found ${policies.length} policies with tenant_id`);
        }

        res.json(policies);
    } catch (error) {
        console.error('❌ Error fetching discount policies:', error);
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
            tenant_id: req.tenant_id
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
            { _id: req.params.id, tenant_id: req.tenant_id },
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
            tenant_id: req.tenant_id
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
            tenant_id: req.tenant_id
        }).populate('siblings');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const policies = await DiscountPolicy.find({
            tenant_id: req.tenant_id,
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

// @route   POST /api/discounts/auto-apply/:student_id
// @desc    Automatically detect and apply all applicable discount policies
// @access  Private
router.post('/auto-apply/:student_id', protect, async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.student_id,
            tenant_id: req.tenant_id
        }).populate('staff_parent_id');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Calculate auto-discounts
        const result = await calculateAutoDiscounts(student);

        if (!result.success) {
            return res.status(500).json({ message: 'Failed to calculate discounts', error: result.error });
        }

        // Update student with auto-discount info
        student.auto_discount_applied = {
            is_enabled: true,
            policies_applied: result.applied_discounts,
            total_auto_discount_percentage: result.total_discount_percentage,
            last_calculated: new Date()
        };

        // Update discount category if staff child
        if (student.is_staff_child && student.staff_parent_id) {
            student.discount_category = 'Staff Child';
        } else if (result.applied_discounts.some(d => d.policy_type === 'Sibling')) {
            student.discount_category = 'Sibling';
        }

        await student.save();

        res.json({
            success: true,
            message: 'Auto-discounts applied successfully',
            student_id: student._id,
            student_name: student.full_name,
            ...result
        });

    } catch (error) {
        console.error('Error applying auto-discounts:', error);
        res.status(500).json({ message: 'Failed to apply auto-discounts', error: error.message });
    }
});

// @route   POST /api/discounts/detect-siblings
// @desc    Detect siblings based on family_id and mobile numbers
// @access  Private
router.post('/detect-siblings', protect, async (req, res) => {
    try {
        const suggestions = await suggestSiblingGroups(req.tenant_id);
        res.json(suggestions);
    } catch (error) {
        console.error('Error detecting siblings:', error);
        res.status(500).json({ message: 'Failed to detect siblings', error: error.message });
    }
});

// @route   GET /api/discounts/siblings-by-family
// @desc    Get siblings grouped by family
// @access  Private
router.get('/siblings-by-family', protect, async (req, res) => {
    try {
        const familyGroups = await detectSiblingsByFamily(req.tenant_id);
        res.json({
            success: true,
            total_families: familyGroups.length,
            families: familyGroups
        });
    } catch (error) {
        console.error('Error fetching siblings by family:', error);
        res.status(500).json({ message: 'Failed to fetch siblings', error: error.message });
    }
});

// @route   GET /api/discounts/siblings-by-mobile
// @desc    Get suggested siblings by matching mobile numbers
// @access  Private
router.get('/siblings-by-mobile', protect, async (req, res) => {
    try {
        const suggestions = await detectSiblingsByMobile(req.tenant_id);
        res.json({
            success: true,
            total_suggestions: suggestions.length,
            suggestions: suggestions
        });
    } catch (error) {
        console.error('Error detecting siblings by mobile:', error);
        res.status(500).json({ message: 'Failed to detect siblings', error: error.message });
    }
});

// @route   POST /api/discounts/link-siblings
// @desc    Link students as siblings
// @access  Private
router.post('/link-siblings', protect, async (req, res) => {
    try {
        const { student_ids, family_data } = req.body;

        if (!student_ids || !Array.isArray(student_ids) || student_ids.length < 2) {
            return res.status(400).json({ message: 'At least 2 student IDs required' });
        }

        const result = await linkSiblings(student_ids, family_data, req.tenant_id);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Auto-apply discounts to all linked siblings
        const students = await Student.find({ _id: { $in: student_ids } });
        const discountResults = await Promise.all(
            students.map(student => calculateAutoDiscounts(student))
        );

        // Update students with auto-discounts
        await Promise.all(
            students.map(async (student, index) => {
                const discountResult = discountResults[index];
                if (discountResult.success) {
                    student.auto_discount_applied = {
                        is_enabled: true,
                        policies_applied: discountResult.applied_discounts,
                        total_auto_discount_percentage: discountResult.total_discount_percentage,
                        last_calculated: new Date()
                    };
                    await student.save();
                }
            })
        );

        res.json({
            ...result,
            discounts_applied: discountResults.filter(r => r.success).length
        });

    } catch (error) {
        console.error('Error linking siblings:', error);
        res.status(500).json({ message: 'Failed to link siblings', error: error.message });
    }
});

// @route   PUT /api/discounts/update-sibling-positions/:family_id
// @desc    Update sibling positions for a family
// @access  Private
router.put('/update-sibling-positions/:family_id', protect, async (req, res) => {
    try {
        const result = await updateSiblingPositions(req.params.family_id);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error updating sibling positions:', error);
        res.status(500).json({ message: 'Failed to update positions', error: error.message });
    }
});

// @route   GET /api/discounts/family-eligible
// @desc    Get all families eligible for sibling discounts
// @access  Private
router.get('/family-eligible', protect, async (req, res) => {
    try {
        const familyGroups = await detectSiblingsByFamily(req.tenant_id);

        // Filter families with 2+ children
        const eligibleFamilies = familyGroups.filter(group => group.students.length >= 2);

        res.json({
            success: true,
            total_eligible: eligibleFamilies.length,
            families: eligibleFamilies
        });
    } catch (error) {
        console.error('Error fetching eligible families:', error);
        res.status(500).json({ message: 'Failed to fetch eligible families', error: error.message });
    }
});

module.exports = router;
