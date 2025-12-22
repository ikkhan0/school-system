const mongoose = require('mongoose');

const familySchema = mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

    // Father Information
    father_name: { type: String, required: true },
    father_cnic: { type: String },
    father_mobile: { type: String, required: true },

    // Mother Information
    mother_name: { type: String },
    mother_mobile: { type: String },

    // Family Head (for WhatsApp messaging)
    family_head_name: { type: String }, // Defaults to father_name if not set
    whatsapp_number: { type: String }, // Defaults to father_mobile if not set

    // Address
    address: { type: String },

    // Additional Info
    total_children: { type: Number, default: 0 }, // Auto-calculated
    notes: { type: String }
}, { timestamps: true });

// Indexes for fast sibling detection
familySchema.index({ school_id: 1, father_mobile: 1 });
familySchema.index({ school_id: 1, mother_mobile: 1 });

// Virtual to get WhatsApp number (fallback to father_mobile)
familySchema.virtual('effective_whatsapp').get(function () {
    return this.whatsapp_number || this.father_mobile;
});

// Virtual to get family head name (fallback to father_name)
familySchema.virtual('effective_family_head').get(function () {
    return this.family_head_name || this.father_name;
});

module.exports = mongoose.model('Family', familySchema);
