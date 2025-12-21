const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true }, // e.g., "Mid-Term 2025"
    start_date: { type: Date },
    end_date: { type: Date },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
