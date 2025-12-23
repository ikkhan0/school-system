const mongoose = require('mongoose');

const classSchema = mongoose.Schema({
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false, index: true },
    name: {
        type: String,
        required: true
    },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    sections: [{
        type: String,
        required: true
    }],
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }]
}, {
    timestamps: true
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
