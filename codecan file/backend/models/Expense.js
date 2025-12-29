const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expense_head_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseHead',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    invoice_number: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    attachment: {
        type: String, // File path or URL
        default: null
    },
    tenant_id: {
        type: String,
        required: true,
        index: true
    },
    school_id: {
        type: String,
        required: false,
        index: true
    }
}, {
    timestamps: true
});

// Index for faster queries
expenseSchema.index({ school_id: 1, date: -1 });
expenseSchema.index({ expense_head_id: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
