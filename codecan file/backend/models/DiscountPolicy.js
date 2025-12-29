const mongoose = require('mongoose');

const discountPolicySchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false
    },
    policy_name: {
        type: String,
        required: true,
        trim: true
    },
    policy_type: {
        type: String,
        required: true,
        enum: ['Staff Child', 'Sibling', 'Merit', 'Financial Aid', 'Early Payment', 'Custom'],
        default: 'Custom'
    },
    discount_percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    discount_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    discount_mode: {
        type: String,
        enum: ['Percentage', 'Fixed Amount'],
        default: 'Percentage'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    conditions: {
        // For Sibling discount
        sibling_position: {
            type: Number, // 2 for 2nd child, 3 for 3rd child, etc.
            min: 1
        },
        // For Merit discount
        min_percentage: {
            type: Number,
            min: 0,
            max: 100
        },
        // For Staff Child discount
        staff_designations: [{
            type: String
        }],
        // For Early Payment discount
        days_before_due: {
            type: Number,
            min: 0
        }
    },
    description: {
        type: String,
        trim: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for faster queries
discountPolicySchema.index({ school_id: 1, policy_type: 1, is_active: 1 });

module.exports = mongoose.model('DiscountPolicy', discountPolicySchema);
