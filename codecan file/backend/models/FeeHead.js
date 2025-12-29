const mongoose = require('mongoose');

const feeHeadSchema = mongoose.Schema({
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true }, // e.g., "Paper Fund", "Examination Fee"
    default_amount: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index to prevent duplicate names per tenant
feeHeadSchema.index({ tenant_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FeeHead', feeHeadSchema);
