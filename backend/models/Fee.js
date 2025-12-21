const mongoose = require('mongoose');

const feeSchema = mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    month: { type: String, required: true }, // e.g., "Jan-2025"

    tuition_fee: { type: Number, required: true },
    concession: { type: Number, default: 0 },
    other_charges: { type: Number, default: 0 },
    arrears: { type: Number, default: 0 },

    // Calculated: (tuition + other + arrears) - concession
    gross_amount: { type: Number, required: true },

    paid_amount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },

    status: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Pending' },
    payment_date: { type: Date }
}, { timestamps: true });

feeSchema.index({ student_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Fee', feeSchema);
