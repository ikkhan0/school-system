const mongoose = require('mongoose');

const studentEnrollmentSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    fee_head_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeHead',
        required: true
        // References club, society, transport, etc.
    },

    // Enrollment details
    enrollment_date: {
        type: Date,
        default: Date.now,
        required: true
    },
    end_date: {
        type: Date
        // When student leaves club/transport
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },

    // Fee customization
    monthly_fee: {
        type: Number,
        min: 0
        // Overrides FeeHead.default_amount if set
        // Allows custom pricing per student
    },

    // Additional details
    notes: {
        type: String,
        trim: true
    },

    // Who enrolled the student
    enrolled_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Tracking
    last_fee_generated_month: {
        type: String
        // Tracks last month when recurring fee was added
        // Prevents duplicate fee generation
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate enrollments
studentEnrollmentSchema.index(
    { student_id: 1, fee_head_id: 1, is_active: 1 },
    { unique: true, partialFilterExpression: { is_active: true } }
);

// Indexes for queries
studentEnrollmentSchema.index({ student_id: 1, is_active: 1 });
studentEnrollmentSchema.index({ fee_head_id: 1, is_active: 1 });
studentEnrollmentSchema.index({ tenant_id: 1, is_active: 1 });

module.exports = mongoose.model('StudentEnrollment', studentEnrollmentSchema);
