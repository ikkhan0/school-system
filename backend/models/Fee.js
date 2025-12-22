const mongoose = require('mongoose');

const feeSchema = mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    month: { type: String, required: true }, // e.g., "Jan-2025"

    tuition_fee: { type: Number, required: true },
    concession: { type: Number, default: 0 }, // Legacy field, kept for backward compatibility
    other_charges: { type: Number, default: 0 },
    arrears: { type: Number, default: 0 },

    // Discount Breakdown
    discount_applied: {
        policy_discount: { type: Number, default: 0 }, // Auto-applied from policies
        manual_discount: { type: Number, default: 0 }, // Manually added discount
        total_discount: { type: Number, default: 0 }, // Sum of policy + manual
        discount_reason: { type: String, trim: true },
        applied_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        applied_at: { type: Date }
    },

    // Fee Calculation
    original_amount: { type: Number, default: 0 }, // Before any discount - defaults to gross_amount if not set
    // Calculated: (tuition + other + arrears) - concession
    gross_amount: { type: Number, required: true }, // After discount
    final_amount: { type: Number, default: 0 }, // Final payable amount - defaults to gross_amount if not set

    paid_amount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },

    status: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Pending' },
    payment_date: { type: Date }
}, { timestamps: true });

feeSchema.index({ student_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Fee', feeSchema);
