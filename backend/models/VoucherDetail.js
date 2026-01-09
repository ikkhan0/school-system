const mongoose = require('mongoose');

const voucherDetailSchema = mongoose.Schema({
    voucher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: { type: String }, // Line item description
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('VoucherDetail', voucherDetailSchema);
