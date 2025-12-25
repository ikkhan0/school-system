const mongoose = require('mongoose');

const feeSchema = mongoose.Schema({
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false, index: true },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

    // Academic Session Reference
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSession',
        index: true
        // Links fee to specific academic year
    },

    month: { type: String, required: true }, // e.g., "Jan-2025" or "Opening Balance"
    fee_type: { type: String, enum: ['Tuition', 'Fund', 'Other'], default: 'Tuition' }, // Differentiates Monthly Fee vs Funds
    title: { type: String }, // e.g., "Examination Fee", "Paper Charges"

    tuition_fee: { type: Number, required: true },
    concession: { type: Number, default: 0 }, // Legacy field, kept for backward compatibility
    other_charges: { type: Number, default: 0 },
    arrears: { type: Number, default: 0 },

    // Opening Balance from Previous Session (Fiscal Carry-Forward)
    opening_balance: {
        type: Number,
        default: 0
        // Balance carried forward from previous academic year
    },

    // Flag to identify opening balance entry
    is_opening_entry: {
        type: Boolean,
        default: false
        // True for the initial carry-forward entry in a new session
    },

    // Discount Breakdown
    discount_applied: {
        policy_discount: { type: Number, default: 0 }, // Auto-applied from policies
        manual_discount: { type: Number, default: 0 }, // Manually added discount
        total_discount: { type: Number, default: 0 }, // Sum of policy + manual
        discount_reason: { type: String, trim: true },
        applied_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        applied_at: { type: Date }
    },

    // Auto-Discount Breakdown (detailed tracking)
    auto_discount_breakdown: [{
        policy_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscountPolicy' },
        policy_name: String,
        policy_type: String,
        discount_amount: Number,
        applied_at: { type: Date, default: Date.now }
    }],

    // WhatsApp Messaging Tracking
    whatsapp_sent: { type: Boolean, default: false },
    whatsapp_sent_at: { type: Date },
    family_message_id: { type: String }, // Track family-based consolidated messages

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

// Compound indexes for better query performance
feeSchema.index({ tenant_id: 1, session_id: 1, student_id: 1 });
feeSchema.index({ student_id: 1, session_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Fee', feeSchema);
