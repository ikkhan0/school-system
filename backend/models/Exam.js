const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false, index: true },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true }, // e.g., "Mid-Term 2025"
    start_date: { type: Date },
    end_date: { type: Date },
    is_active: { type: Boolean, default: true },
    exam_type: { type: String, enum: ['Mid-Term', 'Final', 'Monthly', 'Quiz', 'Other'], default: 'Mid-Term' },

    // Subjects configuration per class
    subjects: [{
        class_id: { type: String, required: true }, // e.g., "Class 1", "Class 2"
        subject_list: [{
            subject_name: { type: String, required: true }, // e.g., "English", "Math"
            total_marks: { type: Number, required: true, default: 100 },
            passing_marks: { type: Number, default: 33 }, // Minimum marks to pass
            theory_marks: { type: Number, default: 0 }, // Theory component
            practical_marks: { type: Number, default: 0 } // Practical component
        }]
    }]
}, { timestamps: true });

// Compound unique index to prevent duplicate exam titles within the same school
examSchema.index({ school_id: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Exam', examSchema);
