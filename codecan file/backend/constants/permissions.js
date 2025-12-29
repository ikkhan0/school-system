// Permission constants for the system

const PERMISSIONS = {
    // Students
    'students.view': 'View Students',
    'students.create': 'Add Students',
    'students.edit': 'Edit Students',
    'students.delete': 'Delete Students',

    // Staff
    'staff.view': 'View Staff',
    'staff.create': 'Add Staff',
    'staff.edit': 'Edit Staff',
    'staff.delete': 'Delete Staff',

    // Fees
    'fees.view': 'View Fees',
    'fees.create': 'Create Fee Vouchers',
    'fees.collect': 'Collect Payments',
    'fees.edit': 'Edit Fees',
    'fees.delete': 'Delete Fees',

    // Attendance
    'attendance.view': 'View Attendance',
    'attendance.mark': 'Mark Attendance',
    'attendance.edit': 'Edit Attendance',

    // Exams
    'exams.view': 'View Exams',
    'exams.create': 'Create Exams',
    'exams.edit': 'Edit Exams',
    'exams.delete': 'Delete Exams',
    'exams.results': 'Enter Results',

    // Classes
    'classes.view': 'View Classes',
    'classes.create': 'Create Classes',
    'classes.edit': 'Edit Classes',
    'classes.delete': 'Delete Classes',

    // Reports
    'reports.view': 'View Reports',
    'reports.export': 'Export Reports',

    // Settings
    'settings.view': 'View Settings',
    'settings.edit': 'Edit Settings',

    // Users
    'users.view': 'View Users',
    'users.create': 'Create Users',
    'users.edit': 'Edit Users',
    'users.delete': 'Delete Users'
};

// Role templates with predefined permissions
const ROLE_TEMPLATES = {
    school_admin: Object.keys(PERMISSIONS), // All permissions

    teacher: [
        'students.view',
        'students.edit',
        'attendance.view',
        'attendance.mark',
        'exams.view',
        'exams.results',
        'classes.view',
        'reports.view'
    ],

    accountant: [
        'students.view',
        'fees.view',
        'fees.create',
        'fees.collect',
        'fees.edit',
        'reports.view',
        'reports.export'
    ],

    cashier: [
        'students.view',
        'fees.view',
        'fees.collect'
    ],

    receptionist: [
        'students.view',
        'students.create',
        'students.edit',
        'classes.view',
        'reports.view'
    ],

    librarian: [
        'students.view',
        'classes.view',
        'reports.view'
    ],

    transport_manager: [
        'students.view',
        'classes.view',
        'reports.view'
    ]
};

module.exports = {
    PERMISSIONS,
    ROLE_TEMPLATES
};
