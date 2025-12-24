const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    // Multi-tenant support
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false, // Optional for backward compatibility
        index: true // Index for faster queries
    },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false }, // Legacy, kept for backward compatibility
    family_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
    roll_no: { type: String, required: true },
    full_name: { type: String, required: true },
    father_name: { type: String }, // Denormalized for easier access
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: { type: String },
    photo: { type: String }, // URL to photo
    class_id: { type: String, required: true },
    section_id: { type: String, required: true },
    category: { type: String, default: 'Regular' },
    monthly_fee: { type: Number, default: 5000 },
    is_active: { type: Boolean, default: true },

    // Contact Information
    student_mobile: { type: String },
    father_mobile: { type: String },
    mother_mobile: { type: String },
    mother_name: { type: String },
    emergency_contact: { type: String },
    email: { type: String },

    // Additional Personal Info
    date_of_birth: { type: Date }, // Alias for dob
    blood_group: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
    religion: { type: String },
    nationality: { type: String, default: 'Pakistani' },
    cnic: { type: String }, // B-Form or CNIC (student's own)
    father_cnic: { type: String }, // Father's CNIC
    mother_cnic: { type: String }, // Mother's CNIC
    student_cnic: { type: String }, // Alias for cnic (student's B-Form/CNIC)

    // Address Details
    current_address: { type: String },
    permanent_address: { type: String },
    city: { type: String },
    postal_code: { type: String },

    // Academic Information
    admission_date: { type: Date },
    admission_number: { type: String },
    previous_school: { type: String },
    previous_class: { type: String },
    wing: { type: String }, // House/Wing (e.g., "Boys Wing (B)")

    // Medical Information
    medical_conditions: { type: String },
    allergies: { type: String },

    // Documents (file paths or URLs)
    birth_certificate: { type: String },
    previous_result: { type: String },

    // Siblings (references to other students)
    siblings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],

    // Staff Child Information
    staff_parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    is_staff_child: {
        type: Boolean,
        default: false
    },

    // Sibling Information
    sibling_discount_position: {
        type: Number, // 1 for first child, 2 for second, etc.
        default: 1
    },

    // Discount Information
    discount_category: {
        type: String,
        enum: ['None', 'Staff Child', 'Sibling', 'Merit', 'Financial Aid', 'Other'],
        default: 'None'
    },
    discount_percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discount_reason: {
        type: String,
        trim: true
    },

    // Auto-Discount Tracking
    auto_discount_applied: {
        is_enabled: { type: Boolean, default: true },
        policies_applied: [{
            policy_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscountPolicy' },
            policy_name: String,
            policy_type: String,
            discount_percentage: Number,
            discount_amount: Number,
            applied_at: { type: Date, default: Date.now }
        }],
        total_auto_discount_percentage: { type: Number, default: 0 },
        last_calculated: { type: Date }
    },

    // Enrolled Subjects - Individual subject enrollment per student
    enrolled_subjects: [{
        subject_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        },
        enrollment_date: {
            type: Date,
            default: Date.now
        },
        is_active: {
            type: Boolean,
            default: true
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
