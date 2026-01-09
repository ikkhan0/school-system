const mongoose = require('mongoose');

const voucherSchema = mongoose.Schema({
    voucher_no: { type: String, required: true }, // Auto-generated e.g. CPV-1001
    date: { type: Date, required: true, default: Date.now },
    fiscal_year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
    type: {
        type: String,
        enum: ['CPV', 'CRV', 'BPV', 'BRV', 'JV', 'CONTRA'], // CPV=Cash Payment, CRV=Cash Receipt, etc.
        required: true
    },
    description: { type: String },
    reference: { type: String }, // Cheque No, Invoice No
    status: {
        type: String,
        enum: ['DRAFT', 'POSTED', 'CANCELLED'],
        default: 'POSTED'
    },

    // Auto-Integration fields
    module_ref: { type: String }, // 'FEE', 'INVENTORY', 'PAYROLL'
    module_id: { type: mongoose.Schema.Types.ObjectId }, // ID of the referenced record

    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure unique voucher no per tenant
voucherSchema.index({ voucher_no: 1, tenant_id: 1 }, { unique: true });

module.exports = mongoose.model('Voucher', voucherSchema);
