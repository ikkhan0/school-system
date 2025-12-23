const mongoose = require('mongoose');

const tenantSchema = mongoose.Schema({
    tenant_id: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
        // Format: 'SCH-001', 'BIS-001', etc.
    },
    school_name: {
        type: String,
        required: true,
        trim: true
    },
    logo_url: {
        type: String,
        default: ''
    },
    subscription_status: {
        type: String,
        enum: ['Active', 'Inactive', 'Trial', 'Suspended', 'Expired'],
        default: 'Trial'
    },
    subscription_plan: {
        type: String,
        enum: ['Free', 'Basic', 'Premium', 'Enterprise'],
        default: 'Free'
    },
    contact_info: {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ''
        },
        country: {
            type: String,
            default: 'Pakistan'
        }
    },
    features_enabled: [{
        type: String,
        enum: [
            'core',        // Basic features (always enabled)
            'fees',        // Fee management
            'exams',       // Exam & results
            'transport',   // Transport management
            'sms',         // SMS notifications
            'accounts',    // Full accounting
            'library',     // Library management
            'hostel',      // Hostel management
            'hr',          // HR & payroll
            'attendance',  // Advanced attendance
            'reports'      // Advanced reports
        ]
    }],
    settings: {
        timezone: {
            type: String,
            default: 'Asia/Karachi'
        },
        currency: {
            type: String,
            default: 'PKR'
        },
        academic_year_start: {
            type: String,
            default: 'April'
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    subscription_start_date: {
        type: Date,
        default: Date.now
    },
    subscription_end_date: {
        type: Date
    },
    max_students: {
        type: Number,
        default: 100 // Limit based on plan
    },
    max_staff: {
        type: Number,
        default: 20
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SuperAdmin'
    }
}, {
    timestamps: true
});

// Index for faster queries
tenantSchema.index({ tenant_id: 1 });
tenantSchema.index({ subscription_status: 1 });
tenantSchema.index({ is_active: 1 });

// Virtual for checking if subscription is valid
tenantSchema.virtual('isSubscriptionValid').get(function () {
    if (this.subscription_status === 'Inactive' || this.subscription_status === 'Suspended') {
        return false;
    }
    if (this.subscription_end_date && new Date() > this.subscription_end_date) {
        return false;
    }
    return true;
});

// Method to check if a feature is enabled
tenantSchema.methods.hasFeature = function (feature) {
    return this.features_enabled.includes('core') || this.features_enabled.includes(feature);
};

// Static method to generate unique tenant_id
tenantSchema.statics.generateTenantId = async function () {
    const count = await this.countDocuments();
    const id = String(count + 1).padStart(3, '0');
    return `SCH-${id}`;
};

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
