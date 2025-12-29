const mongoose = require('mongoose');

const whatsappTemplateSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false // Can be null for system defaults
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

whatsappTemplateSchema.index({ tenant_id: 1, type: 1 });

module.exports = mongoose.model('WhatsappTemplate', whatsappTemplateSchema);
