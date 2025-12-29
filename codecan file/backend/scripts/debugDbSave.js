const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const WhatsappTemplate = require('../models/WhatsappTemplate');
const StaffAttendance = require('../models/StaffAttendance');
const Staff = require('../models/Staff'); // Need a valid staff ID

dotenv.config();

const debugSave = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        // 1. Try to fetch a staff member to use ID
        const staff = await Staff.findOne();
        if (!staff) {
            console.log("No staff found to test attendance.");
        } else {
            console.log(`Testing with staff: ${staff._id} (Tenant: ${staff.tenant_id})`);

            // 2. Try to save Staff Attendance
            try {
                console.log("Attempting to save StaffAttendance...");
                const att = new StaffAttendance({
                    tenant_id: staff.tenant_id, // Use staff's tenant_id
                    staff_id: staff._id,
                    date: new Date(), // Now
                    status: 'Present',
                    marked_by: staff.tenant_id // Just using an ID (doesn't link strict FK often)
                });
                await att.save();
                console.log("✅ StaffAttendance saved successfully!");
                // Cleanup
                await StaffAttendance.deleteOne({ _id: att._id });
            } catch (err) {
                console.error("❌ StaffAttendance Save Failed:");
                console.error(err);
            }
        }

        // 3. Try to save Whatsapp Template
        try {
            console.log("Attempting to save WhatsappTemplate...");
            // Use same tenant_id as staff if available, else generic ID
            const tenantId = staff ? staff.tenant_id : new mongoose.Types.ObjectId();

            const tmpl = new WhatsappTemplate({
                school_id: tenantId,
                name: "Debug Template",
                type: "general",
                content: "Debug content",
                isActive: true
            });
            await tmpl.save();
            console.log("✅ WhatsappTemplate saved successfully!");
            // Cleanup
            await WhatsappTemplate.deleteOne({ _id: tmpl._id });
        } catch (err) {
            console.error("❌ WhatsappTemplate Save Failed:");
            console.error(err);
        }

        process.exit();
    } catch (error) {
        console.error("Connection Error:", error);
        process.exit(1);
    }
};

debugSave();
