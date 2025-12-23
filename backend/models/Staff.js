const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    // Multi-tenant support
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false, index: true },
    // School Reference
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },

    // Personal Information
    full_name: {
        type: String,
        required: true,
        trim: true
    },
    employee_id: {
        type: String,
        required: true,
        unique: true
    },
    cnic: {
        type: String
        // Optional - can be added later
    },
    dob: Date,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    photo: String,
    mobile: {
        type: String,
        required: true
    },
    email: String,
    current_address: String,
    permanent_address: String,
    city: String,
    blood_group: String,
    religion: String,
    nationality: {
        type: String,
        default: 'Pakistani'
    },

    // Employment Details
    designation: {
        type: String,
        required: true,
        enum: [
            'Principal',
            'Vice Principal',
            'Head Teacher',
            'Senior Teacher',
            'Teacher',
            'Subject Teacher',
            'Class Teacher',
            'Admin Officer',
            'Accountant',
            'Librarian',
            'Lab Assistant',
            'Peon',
            'Watchman',
            'Cleaner',
            'Driver',
            'Other'
        ]
    },
    department: {
        type: String,
        enum: ['Academic', 'Administration', 'Support', 'Management']
    },
    joining_date: {
        type: Date,
        required: true
    },
    employment_type: {
        type: String,
        enum: ['Permanent', 'Contract', 'Part-Time', 'Visiting'],
        default: 'Permanent'
    },

    // Salary Information
    basic_salary: {
        type: Number,
        required: true
    },
    allowances: {
        house_rent: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },

    // For Teachers - Assigned Subjects and Classes
    assigned_subjects: [{
        subject_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        }
    }],
    assigned_classes: [{
        class_name: String,
        section: String
    }],

    // Bank Details
    bank_name: String,
    account_number: String,
    account_title: String,

    // Emergency Contact
    emergency_contact_name: String,
    emergency_contact_mobile: String,
    emergency_contact_relation: String,

    // Documents
    documents: [{
        type: String,
        url: String,
        uploaded_date: {
            type: Date,
            default: Date.now
        }
    }],

    // Status
    is_active: {
        type: Boolean,
        default: true
    },
    leaving_date: Date,
    leaving_reason: String

}, {
    timestamps: true
});

// Indexes
staffSchema.index({ school_id: 1, employee_id: 1 });
staffSchema.index({ school_id: 1, is_active: 1 });
staffSchema.index({ school_id: 1, designation: 1 });

module.exports = mongoose.model('Staff', staffSchema);
