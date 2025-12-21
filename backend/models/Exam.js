const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true }, // e.g., "Mid-Term 2025"
    start_date: { type: Date },
    end_date: { type: Date },
    is_active: { type: Boolean, default: true },

    // Subjects configuration per class
    subjects: [{
        class_id: { type: String, required: true }, // e.g., "Class 1", "Class 2"
        subject_list: [{
            subject_name: { type: String, required: true }, // e.g., "English", "Math"
            total_marks: { type: Number, required: true, default: 100 }
        }]
    }]
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
