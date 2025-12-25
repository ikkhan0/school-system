const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    // Session Details
    session_name: {
        type: String,
        required: true
        // e.g., "2024-2025", "2023-24"
    },

    start_date: {
        type: Date,
        required: true
    },

    end_date: {
        type: Date,
        required: true
    },

    // Status Flags
    is_active: {
        type: Boolean,
        default: true
        // Multiple sessions can be active simultaneously
    },

    is_current: {
        type: Boolean,
        default: false
        // Only ONE session can be marked as "current" (default selection)
    },

    is_locked: {
        type: Boolean,
        default: false
        // Prevents editing past data
    },

    // Module-specific locks
    locked_modules: {
        attendance: { type: Boolean, default: false },
        fees: { type: Boolean, default: false },
        marks: { type: Boolean, default: false },
        admissions: { type: Boolean, default: false }
    },

    // Metadata
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    notes: String

}, { timestamps: true });

// Compound index for tenant + session name uniqueness
academicSessionSchema.index({ tenant_id: 1, session_name: 1 }, { unique: true });

// Ensure only one current session per tenant
academicSessionSchema.pre('save', async function (next) {
    if (this.is_current && this.isModified('is_current')) {
        // Unmark other sessions as current
        await this.constructor.updateMany(
            {
                tenant_id: this.tenant_id,
                _id: { $ne: this._id }
            },
            { is_current: false }
        );
    }
    next();
});

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
