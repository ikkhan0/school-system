const mongoose = require('mongoose');

const whatsappTemplateSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false // Can be null for system defaults if we go that route, but for now user implies school customization
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['fee_ledger', 'family_fee', 'attendance_absent', 'attendance_late', 'violation', 'general', 'fee_reminder'],
        default: 'general'
    },
    content: {
        type: String,
        required: true
    },
    variables: [{
        type: String // e.g. "student_name", "total_due"
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique names per school or type per school if desired? 
// For now, let's just index school_id
whatsappTemplateSchema.index({ school_id: 1, type: 1 });

module.exports = mongoose.model('WhatsappTemplate', whatsappTemplateSchema);
