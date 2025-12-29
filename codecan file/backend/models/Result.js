const mongoose = require('mongoose');

const resultSchema = mongoose.Schema({
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
    },

    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false },
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class_id: { type: String, required: true },
    section_id: { type: String, required: true },
    subjects: [{
        subject_name: { type: String, required: true },
        total_marks: { type: Number, required: true },
        obtained_marks: { type: Number, required: true }
    }],
    total_obtained: { type: Number },
    total_max: { type: Number },
    percentage: { type: Number },
    grade: { type: String },
    remarks: { type: String }
}, { timestamps: true });

// Ensure one result set per student per exam per session
resultSchema.index({ exam_id: 1, student_id: 1, session_id: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
