const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'school_admin', 'teacher', 'student'], default: 'school_admin' },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    full_name: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
