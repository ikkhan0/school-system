// Permission constants for the frontend

export const PERMISSIONS = {
    // Students
    'students.view': 'View Students',
    'students.create': 'Add Students',
    'students.edit': 'Edit Students',
    'students.delete': 'Delete Students',
    'students.import': 'Import Students (CSV)',
    'students.export': 'Export Student Data',

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
    'fees.discount': 'Apply Discounts',
    'fees.voucher.print': 'Print Fee Vouchers',
    'fees.refund': 'Process Refunds',

    // Attendance
    'attendance.view': 'View Attendance',
    'attendance.mark': 'Mark Attendance',
    'attendance.edit': 'Edit Attendance',

    // Exams - Expanded
    'exams.view': 'View Exams',
    'exams.create': 'Create Exams',
    'exams.edit': 'Edit Exams',
    'exams.delete': 'Delete Exams',
    'exams.marks.entry': 'Enter Student Marks',
    'exams.marks.view': 'View Student Marks',
    'exams.results.print': 'Print Result Cards',
    'exams.results.publish': 'Publish Results',

    // Classes
    'classes.view': 'View Classes',
    'classes.create': 'Create Classes',
    'classes.edit': 'Edit Classes',
    'classes.delete': 'Delete Classes',

    // Reports - By Type
    'reports.view': 'View All Reports (Legacy)',
    'reports.export': 'Export All Reports (Legacy)',
    'reports.academic.view': 'View Academic Reports',
    'reports.academic.export': 'Export Academic Reports',
    'reports.fee.view': 'View Fee Reports',
    'reports.fee.export': 'Export Fee Reports',
    'reports.defaulters.view': 'View Fee Defaulters',
    'reports.attendance.view': 'View Attendance Reports',
    'reports.staff.view': 'View Staff Reports',

    // Settings
    'settings.view': 'View Settings',
    'settings.edit': 'Edit Settings',

    // Users - Separated
    'users.view': 'View Users',
    'users.create': 'Create Users',
    'users.edit': 'Edit Users',
    'users.delete': 'Delete Users'
};

// Role templates with predefined permissions
export const ROLE_TEMPLATES = {
    school_admin: Object.keys(PERMISSIONS), // All permissions

    teacher: [
        'students.view',
        'attendance.view',
        'attendance.mark',
        'exams.view',
        'exams.marks.entry',
        'exams.marks.view',
        'exams.results.print',
        'classes.view',
        'reports.academic.view',
        'reports.attendance.view'
    ],

    cashier: [
        'students.view',
        'fees.view',
        'fees.collect',
        'fees.voucher.print',
        'reports.fee.view',
        'reports.defaulters.view'
    ],

    accountant: [
        'students.view',
        'fees.view',
        'fees.create',
        'fees.collect',
        'fees.edit',
        'fees.discount',
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
