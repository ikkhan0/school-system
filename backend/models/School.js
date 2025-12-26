const mongoose = require('mongoose');

const schoolSchema = mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    logo: { type: String }, // URL to logo
    subscription_status: { type: String, default: 'active' }, // active, inactive
    settings: {
        currency: { type: String, default: 'PKR' },
        session_year: { type: String, default: '2024-2025' },
        date_format: {
            type: String,
            enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'],
            default: 'DD/MM/YYYY'
        },
        time_format: {
            type: String,
            enum: ['12-hour', '24-hour'],
            default: '12-hour'
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
