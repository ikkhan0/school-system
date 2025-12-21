const mongoose = require('mongoose');

const classSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    sections: [{
        type: String,
        required: true
    }]
}, {
    timestamps: true
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
