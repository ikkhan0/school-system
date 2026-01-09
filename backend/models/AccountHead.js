const mongoose = require('mongoose');

const accountHeadSchema = mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true }, // e.g. 1001
    type: {
        type: String,
        enum: ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'],
        required: true
    },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', default: null }, // For nested accounts
    is_system: { type: Boolean, default: false }, // Prevent deletion of system accounts (Cash, Bank)
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

// Ensure unique code per tenant
accountHeadSchema.index({ code: 1, tenant_id: 1 }, { unique: true });

module.exports = mongoose.model('AccountHead', accountHeadSchema);
