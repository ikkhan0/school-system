const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false
    },
    staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    month: {
        type: String,
        required: true // Format: "Jan-2025"
    },
    year: {
        type: Number,
        required: true
    },

    // Salary Components
    basic_salary: {
        type: Number,
        required: true
    },
    allowances: {
        house_rent: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    deductions: {
        tax: { type: Number, default: 0 },
        provident_fund: { type: Number, default: 0 },
        loan: { type: Number, default: 0 },
        absence: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },

    // Calculated Amounts
    gross_salary: {
        type: Number,
        required: true
    },
    total_deductions: {
        type: Number,
        default: 0
    },
    net_salary: {
        type: Number,
        required: true
    },

    // Attendance Summary
    working_days: Number,
    present_days: Number,
    absent_days: Number,
    leave_days: Number,

    // Payment Details
    payment_status: {
        type: String,
        enum: ['Pending', 'Paid', 'Partial'],
        default: 'Pending'
    },
    payment_date: Date,
    payment_method: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Cheque']
    },
    payment_reference: String,

    notes: String,
    generated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
salarySchema.index({ school_id: 1, month: 1, year: 1 });
salarySchema.index({ staff_id: 1, month: 1, year: 1 });
salarySchema.index({ school_id: 1, staff_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema);
