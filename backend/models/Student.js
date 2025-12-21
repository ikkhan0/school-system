const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    family_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
    roll_no: { type: String, required: true },
    full_name: { type: String, required: true },
    father_name: { type: String }, // Denormalized for easier access
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: { type: String },
    photo: { type: String }, // URL to photo
    class_id: { type: String, required: true },
    section_id: { type: String, required: true },
    category: { type: String, default: 'Regular' },
    monthly_fee: { type: Number, default: 5000 },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
