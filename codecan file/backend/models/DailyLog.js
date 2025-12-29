const mongoose = require('mongoose');

const dailyLogSchema = mongoose.Schema({
    // Multi-tenant support
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false, // Optional for backward compatibility
        index: true // Index for faster queries
    },

    // Academic Session Reference
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSession',
        index: true
        // Links attendance to specific academic year
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

// Compound indexes for session-based queries
dailyLogSchema.index({ tenant_id: 1, session_id: 1, date: 1 });
dailyLogSchema.index({ student_id: 1, session_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
