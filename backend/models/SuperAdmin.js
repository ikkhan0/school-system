const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        default: 'super_admin',
        immutable: true
    },
    phone: {
        type: String,
        default: ''
    },
    is_active: {
        type: Boolean,
        default: true
    },
    last_login: {
        type: Date
    },
    permissions: {
        type: [String],
        default: ['*'] // Full access to everything
    }
}, {
    timestamps: true
});

// Hash password before saving
superAdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
superAdminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Don't return password in JSON
superAdminSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

module.exports = SuperAdmin;
