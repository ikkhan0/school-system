const mongoose = require('mongoose');

const examResultSchema = mongoose.Schema({
    // Multi-tenant support
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false,
        index: true
    },

    // Academic Session Reference
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSession',
        index: true
        // Links exam results to specific academic year
    },

    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false },
    class_id: { type: String, required: true },
    section_id: { type: String, required: true },

    subjects: [{
        subject_name: { type: String, required: true },
        total_marks: { type: Number, required: true },
        obtained_marks: { type: Number, required: true },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Leave', 'Sick'],
            default: 'Present'
        }
    }],

    total_obtained: { type: Number, required: true },
    total_max: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String, required: true },

    // Additional stats for result card
    stats: {
        attendance: {
            present: { type: Number, default: 0 },
            absent: { type: Number, default: 0 },
            leave: { type: Number, default: 0 }
        },
        fees: {
            balance: { type: Number, default: 0 }
        },
        behavior: {
            uniform_violation: { type: Number, default: 0 },
            shoes_violation: { type: Number, default: 0 },
            hygiene_violation: { type: Number, default: 0 },
            late_violation: { type: Number, default: 0 },
            homework_violation: { type: Number, default: 0 },
            books_violation: { type: Number, default: 0 }
        }
    }
}, { timestamps: true });

// Index for faster queries
examResultSchema.index({ tenant_id: 1, session_id: 1, exam_id: 1 });
examResultSchema.index({ student_id: 1, session_id: 1, exam_id: 1 }, { unique: true });
examResultSchema.index({ exam_id: 1, session_id: 1, class_id: 1, section_id: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
