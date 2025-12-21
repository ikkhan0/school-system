const mongoose = require('mongoose');

const familySchema = mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    father_name: { type: String, required: true },
    father_cnic: { type: String },
    father_mobile: { type: String, required: true }, // WhatsApp Number
    address: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Family', familySchema);
