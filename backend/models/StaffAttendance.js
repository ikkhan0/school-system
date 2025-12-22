const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Leave', 'Half-Day', 'Late'],
        required: true
    },
    check_in_time: String,
    check_out_time: String,
    leave_type: {
        type: String,
        enum: ['Casual', 'Sick', 'Annual', 'Unpaid', 'Other']
    },
    notes: String,
    marked_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
staffAttendanceSchema.index({ school_id: 1, date: -1 });
staffAttendanceSchema.index({ staff_id: 1, date: -1 });
staffAttendanceSchema.index({ school_id: 1, staff_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
