const mongoose = require('mongoose');

const dailyLogSchema = mongoose.Schema({
    // Multi-tenant support
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false, // Optional for backward compatibility
        index: true // Index for faster queries
    },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false }, // Legacy, kept for backward compatibility
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Leave', 'Late'], default: 'Present' },

    // Violations (Default False = Good)
    uniform_violation: { type: Boolean, default: false },
    shoes_violation: { type: Boolean, default: false },
    hygiene_violation: { type: Boolean, default: false },
    late_violation: { type: Boolean, default: false },
    homework_violation: { type: Boolean, default: false },
    books_violation: { type: Boolean, default: false },

    teacher_remarks: { type: String }
}, { timestamps: true });

dailyLogSchema.index({ student_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
