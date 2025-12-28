const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [
            'super_admin',      // System-wide admin (not tied to tenant)
            'school_admin',     // Full access to their school
            'accountant',       // Financial access
            'cashier',          // Fee collection only
            'teacher',          // Academic access
            'receptionist',     // Front desk access
            'librarian',        // Library access
            'transport_manager' // Transport access
        ],
        default: 'school_admin'
    },
    // Multi-tenant support
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        // Required for all roles except super_admin
        required: function () {
            return this.role !== 'super_admin';
        }
    },
    // Legacy school_id (keeping for backward compatibility during migration)
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    full_name: {
        type: String
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    // Custom permissions array for fine-grained access control
    permissions: [{
        type: String
        // Examples: 'fees:read', 'fees:write', 'students:delete', etc.
    }],
    // User status
    is_active: {
        type: Boolean,
        default: true
    },
    // For teachers - assigned classes
    assigned_classes: [{
        class_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        },
        section: String
    }],
    // Language preference
    preferred_language: {
        type: String,
        enum: ['en', 'ur', 'ar', 'hi', 'bn', 'es', 'fr'],
        default: 'en'
    },
    last_login: {
        type: Date
    }
}, { timestamps: true });

// Index for faster queries
userSchema.index({ tenant_id: 1, role: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

// Method to check if user has a specific permission
userSchema.methods.hasPermission = function (permission) {
    // Super admin has all permissions
    if (this.role === 'super_admin') return true;

    // School admin has all permissions for their tenant
    if (this.role === 'school_admin') return true;

    // Check for wildcard permission
    if (this.permissions.includes('*')) return true;

    // Check for specific permission
    if (this.permissions.includes(permission)) return true;

    // Check for module-level permission (e.g., 'fees:*')
    const module = permission.split(':')[0];
    if (this.permissions.includes(`${module}:*`)) return true;

    return false;
};

module.exports = mongoose.model('User', userSchema);
