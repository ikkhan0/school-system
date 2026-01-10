const mongoose = require('mongoose');

const schoolSchema = mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    logo: { type: String }, // URL to logo
    principal_signature: { type: String }, // URL to signature image
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
        },
        // Multi-language settings
        default_language: {
            type: String,
            enum: ['en', 'ur', 'ar', 'hi', 'bn', 'es', 'fr'],
            default: 'en'
        },
        available_languages: {
            type: [String],
            default: ['en', 'ur']
        },
        rtl_enabled: {
            type: Boolean,
            default: false
        },
        // Fee voucher payment instructions
        fee_voucher_note: {
            type: String,
            default: ''
        },
        // Module Feature Flags (SaaS Control)
        modules: {
            inventory: { type: Boolean, default: true }, // Default enabled for now for testing
            accounting: { type: Boolean, default: false }
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
