const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        trim: true,
        uppercase: true
    },
    total_marks: {
        type: Number,
        default: 100
    },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false, index: true },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
subjectSchema.index({ school_id: 1, is_active: 1 });
subjectSchema.index({ school_id: 1, name: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
