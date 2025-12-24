const mongoose = require('mongoose');

const expenseHeadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    tenant_id: {
        type: String,
        required: true,
        index: true
    },
    school_id: {
        type: String,
        required: true,
        index: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for uniqueness per school
expenseHeadSchema.index({ school_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ExpenseHead', expenseHeadSchema);
