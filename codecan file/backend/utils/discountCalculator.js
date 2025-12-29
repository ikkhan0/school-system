const Student = require('../models/Student');
const DiscountPolicy = require('../models/DiscountPolicy');

/**
 * Calculate all applicable auto-discounts for a student
 * @param {Object} student - Student document
 * @param {Array} policies - Array of active discount policies (optional, will fetch if not provided)
 * @returns {Object} - Discount calculation result
 */
async function calculateAutoDiscounts(student, policies = null) {
    try {
        // Fetch active policies if not provided
        if (!policies) {
            policies = await DiscountPolicy.find({
                school_id: student.school_id,
                is_active: true
            });
        }

        const appliedDiscounts = [];
        let totalDiscountPercentage = 0;
        let totalDiscountAmount = 0;

        // Check for Staff Child discount
        if (student.is_staff_child && student.staff_parent_id) {
            const staffChildDiscount = await applyStaffChildDiscount(student, policies);
            if (staffChildDiscount) {
                appliedDiscounts.push(staffChildDiscount);
                totalDiscountPercentage += staffChildDiscount.discount_percentage || 0;
                totalDiscountAmount += staffChildDiscount.discount_amount || 0;
            }
        }

        // Check for Sibling discount
        if (student.family_id) {
            const siblings = await Student.find({
                family_id: student.family_id,
                school_id: student.school_id,
                is_active: true,
                _id: { $ne: student._id }
            });

            if (siblings.length > 0) {
                const siblingDiscount = await applySiblingDiscount(student, siblings, policies);
                if (siblingDiscount) {
                    appliedDiscounts.push(siblingDiscount);
                    totalDiscountPercentage += siblingDiscount.discount_percentage || 0;
                    totalDiscountAmount += siblingDiscount.discount_amount || 0;
                }
            }
        }

        // Check for Merit discount
        if (student.discount_category === 'Merit') {
            const meritPolicy = policies.find(p => p.policy_type === 'Merit');
            if (meritPolicy) {
                appliedDiscounts.push({
                    policy_id: meritPolicy._id,
                    policy_name: meritPolicy.policy_name,
                    policy_type: 'Merit',
                    discount_percentage: meritPolicy.discount_percentage,
                    discount_amount: meritPolicy.discount_amount,
                    discount_mode: meritPolicy.discount_mode
                });
                totalDiscountPercentage += meritPolicy.discount_percentage || 0;
                totalDiscountAmount += meritPolicy.discount_amount || 0;
            }
        }

        // Check for Financial Aid discount
        if (student.discount_category === 'Financial Aid') {
            const aidPolicy = policies.find(p => p.policy_type === 'Financial Aid');
            if (aidPolicy) {
                appliedDiscounts.push({
                    policy_id: aidPolicy._id,
                    policy_name: aidPolicy.policy_name,
                    policy_type: 'Financial Aid',
                    discount_percentage: aidPolicy.discount_percentage,
                    discount_amount: aidPolicy.discount_amount,
                    discount_mode: aidPolicy.discount_mode
                });
                totalDiscountPercentage += aidPolicy.discount_percentage || 0;
                totalDiscountAmount += aidPolicy.discount_amount || 0;
            }
        }

        return {
            success: true,
            student_id: student._id,
            student_name: student.full_name,
            applied_discounts: appliedDiscounts,
            total_discount_percentage: Math.min(totalDiscountPercentage, 100), // Cap at 100%
            total_discount_amount: totalDiscountAmount,
            discount_count: appliedDiscounts.length
        };

    } catch (error) {
        console.error('Error calculating auto discounts:', error);
        return {
            success: false,
            error: error.message,
            applied_discounts: []
        };
    }
}

/**
 * Apply staff child discount
 * @param {Object} student - Student document
 * @param {Array} policies - Array of discount policies
 * @returns {Object|null} - Applied discount or null
 */
async function applyStaffChildDiscount(student, policies) {
    const staffChildPolicy = policies.find(p => p.policy_type === 'Staff Child');

    if (!staffChildPolicy) {
        return null;
    }

    return {
        policy_id: staffChildPolicy._id,
        policy_name: staffChildPolicy.policy_name,
        policy_type: 'Staff Child',
        discount_percentage: staffChildPolicy.discount_percentage,
        discount_amount: staffChildPolicy.discount_amount,
        discount_mode: staffChildPolicy.discount_mode
    };
}

/**
 * Apply sibling discount based on position
 * @param {Object} student - Student document
 * @param {Array} siblings - Array of sibling students
 * @param {Array} policies - Array of discount policies
 * @returns {Object|null} - Applied discount or null
 */
async function applySiblingDiscount(student, siblings, policies) {
    // Get sibling position
    const position = getSiblingPosition(student, siblings);

    // Find sibling policy
    const siblingPolicies = policies.filter(p => p.policy_type === 'Sibling');

    if (siblingPolicies.length === 0) {
        return null;
    }

    // Find policy matching the sibling position
    let applicablePolicy = siblingPolicies.find(p =>
        p.conditions && p.conditions.sibling_position === position
    );

    // If no specific position policy, use general sibling policy
    if (!applicablePolicy) {
        applicablePolicy = siblingPolicies.find(p =>
            !p.conditions || !p.conditions.sibling_position
        );
    }

    if (!applicablePolicy) {
        return null;
    }

    return {
        policy_id: applicablePolicy._id,
        policy_name: applicablePolicy.policy_name,
        policy_type: 'Sibling',
        discount_percentage: applicablePolicy.discount_percentage,
        discount_amount: applicablePolicy.discount_amount,
        discount_mode: applicablePolicy.discount_mode,
        sibling_position: position,
        total_siblings: siblings.length + 1
    };
}

/**
 * Determine sibling position (1st, 2nd, 3rd child, etc.)
 * @param {Object} student - Student document
 * @param {Array} siblings - Array of sibling students
 * @returns {Number} - Position (1, 2, 3, etc.)
 */
function getSiblingPosition(student, siblings) {
    // If manually set, use that
    if (student.sibling_discount_position && student.sibling_discount_position > 0) {
        return student.sibling_discount_position;
    }

    // Otherwise, calculate based on admission date
    const allChildren = [student, ...siblings];

    // Sort by admission date (earliest first)
    allChildren.sort((a, b) => {
        const dateA = a.admission_date || a.createdAt || new Date();
        const dateB = b.admission_date || b.createdAt || new Date();
        return new Date(dateA) - new Date(dateB);
    });

    // Find position
    const position = allChildren.findIndex(s => s._id.toString() === student._id.toString()) + 1;

    return position;
}

/**
 * Calculate discount amount from fee
 * @param {Number} feeAmount - Original fee amount
 * @param {Object} discountInfo - Discount information
 * @returns {Number} - Discount amount
 */
function calculateDiscountAmount(feeAmount, discountInfo) {
    if (discountInfo.discount_mode === 'Percentage') {
        return (feeAmount * discountInfo.discount_percentage) / 100;
    } else {
        return discountInfo.discount_amount || 0;
    }
}

module.exports = {
    calculateAutoDiscounts,
    applyStaffChildDiscount,
    applySiblingDiscount,
    getSiblingPosition,
    calculateDiscountAmount
};
