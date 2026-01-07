const mongoose = require('mongoose');

const studentCustomFeeSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    fee_head_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeHead',
        required: true
    },

    // Amount and details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    reason: {
        type: String,
        trim: true
        // For fines: "Late library book return"
        // For admission: "New student admission fee"
    },

    // Which month/voucher to attach to
    applied_to_month: {
        type: String,
        // e.g., "Jan-2025", "Feb-2025", "Admission", "One-time"
    },

    // Payment tracking
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Waived', 'Cancelled'],
        default: 'Pending',
        index: true
    },
    paid_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    paid_date: {
        type: Date
    },
    payment_reference: {
        type: String
        // Reference to Fee model payment
    },

    // For recurring charges (clubs, transport, etc.)
    is_recurring: {
        type: Boolean,
        default: false
    },
    recurrence_frequency: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Yearly', 'One-time'],
        default: 'One-time'
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    end_date: {
        type: Date
        // When recurring charge should stop
    },

    // Who applied and when
    applied_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applied_date: {
        type: Date,
        default: Date.now
    },

    // Waiver tracking
    waived_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waived_date: {
        type: Date
    },
    waiver_reason: {
        type: String
    },

    // Notes
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for performance
studentCustomFeeSchema.index({ student_id: 1, status: 1 });
studentCustomFeeSchema.index({ tenant_id: 1, applied_to_month: 1 });
studentCustomFeeSchema.index({ fee_head_id: 1 });
studentCustomFeeSchema.index({ status: 1, applied_date: -1 });

// Calculate balance before saving
studentCustomFeeSchema.pre('save', function (next) {
    this.balance = this.amount - this.paid_amount;
    next();
});

module.exports = mongoose.model('StudentCustomFee', studentCustomFeeSchema);
