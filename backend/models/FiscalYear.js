const mongoose = require('mongoose');

const fiscalYearSchema = mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Fiscal Year 2025-26"
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: false },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('FiscalYear', fiscalYearSchema);
