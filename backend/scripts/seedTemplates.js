const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WhatsappTemplate = require('../models/WhatsappTemplate');
const connectDB = require('../config/db');

dotenv.config();

const sampleTemplates = [
    {
        name: "Standard Fee Ledger",
        type: "fee_ledger",
        content: `*Fee Ledger for {student_name}*
Roll No: {roll_no}
Class: {class_section}

{history_summary}

*Total Pending Due: {total_due}*
Please clear dues immediately.
- {school_name}`,
        isActive: true,
        variables: ["{student_name}", "{roll_no}", "{class_section}", "{history_summary}", "{total_due}", "{school_name}"]
    },
    {
        name: "Daily Report - Absent",
        type: "attendance_absent",
        content: `Dear Parent,

Daily Report for {student_name} ({date}):
Status: Absent

Your child is absent from school today. Please ensure regular attendance.

- {school_name}`,
        isActive: true,
        variables: ["{student_name}", "{date}", "{school_name}"]
    },
    {
        name: "Daily Report - Late",
        type: "attendance_late",
        content: `Dear Parent,

Daily Report for {student_name} ({date}):
Status: Late

Your child arrived late to school today. Please ensure punctuality.

- {school_name}`,
        isActive: true,
        variables: ["{student_name}", "{date}", "{school_name}"]
    },
    {
        name: "Daily Report - Violation",
        type: "violation",
        content: `Dear Parent,

Daily Report for {student_name} ({date}):
Status: {status}

Issues Reported: {violation_type}
Remarks: {remarks}

Please discuss this with your child to improve compliance.

- {school_name}`,
        isActive: true,
        variables: ["{student_name}", "{date}", "{status}", "{violation_type}", "{remarks}", "{school_name}"]
    },
    {
        name: "Family Fee Reminder",
        type: "family_fee",
        content: `Assalam-o-Alaikum (Dear {father_name}),

Fee Reminder for {month}
----------------------------------------

{children_list}

----------------------------------------
*Total Balance: {total_due}*
----------------------------------------

Please clear the dues as soon as possible.

Regards,
{school_name}`,
        isActive: true,
        variables: ["{father_name}", "{month}", "{children_list}", "{total_due}", "{school_name}"]
    }
];

const seedTemplates = async () => {
    try {
        await connectDB();

        console.log('Connected to DB. Checking for existing system templates...');

        for (const tmpl of sampleTemplates) {
            // Check if system template exists (school_id is null/undefined)
            const exists = await WhatsappTemplate.findOne({
                type: tmpl.type,
                school_id: null
            });

            if (!exists) {
                await WhatsappTemplate.create({
                    ...tmpl,
                    school_id: null // System default
                });
                console.log(`Created template: ${tmpl.name}`);
            } else {
                console.log(`Template already exists: ${tmpl.name}`);
            }
        }

        console.log('Templates seeded successfully.');
        process.exit();
    } catch (error) {
        console.error('Error seeding templates:', error);
        process.exit(1);
    }
};

seedTemplates();
