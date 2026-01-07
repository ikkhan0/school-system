const mongoose = require('mongoose');

const feeHeadSchema = mongoose.Schema({
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true }, // e.g., "Paper Fund", "Examination Fee", "Horse Riding Club"
    default_amount: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },

    // NEW FIELDS
    category: {
        type: String,
        enum: ['admission', 'fine', 'club', 'society', 'transport', 'exam', 'other'],
        default: 'other',
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    is_optional: {
        type: Boolean,
        default: false
        // True for clubs, societies (students can choose to enroll)
        // False for mandatory fees (admission, exams)
    },
    requires_enrollment: {
        type: Boolean,
        default: false
        // True for clubs, societies, transport (need StudentEnrollment record)
        // False for one-time fees (admission, fines)
    },
    color: {
        type: String,
        default: '#3B82F6'
        // Hex color for UI display
    }
}, { timestamps: true });

// Compound index to prevent duplicate names per tenant
feeHeadSchema.index({ tenant_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FeeHead', feeHeadSchema);
