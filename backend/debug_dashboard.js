const mongoose = require('mongoose');
require('dotenv').config();

const Fee = require('./models/Fee');
const DailyLog = require('./models/DailyLog');
const Student = require('./models/Student');
const School = require('./models/School');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to DB');

    try {
        const schools = await School.find({});
        console.log(`Found ${schools.length} schools.`);

        for (const school of schools) {
            console.log(`\n--- School: ${school.name || 'Unknown'} (ID: ${school._id}) ---`);

            // 1. Check Fee Data (Last 6 Months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const feeCount = await Fee.countDocuments({
                tenant_id: school._id,
                payment_date: { $gte: sixMonthsAgo }
            });
            console.log(`Fees (Last 6 Months): ${feeCount}`);

            // Check TOTAL fees to see if date is the issue
            const totalFees = await Fee.countDocuments({ tenant_id: school._id });
            console.log(`Total Fees (All Time): ${totalFees}`);
            if (totalFees > 0) {
                const latestFee = await Fee.findOne({ tenant_id: school._id }).sort({ payment_date: -1 });
                console.log(`Latest Fee Date: ${latestFee?.payment_date}`);
            }


            // 2. Check Attendance Data (Last 4 Weeks)
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

            const attendanceCount = await DailyLog.countDocuments({
                tenant_id: school._id,
                date: { $gte: fourWeeksAgo }
            });
            console.log(`Attendance (Last 4 Weeks): ${attendanceCount}`);

            // Check TOTAL attendance
            const totalAttendance = await DailyLog.countDocuments({ tenant_id: school._id });
            console.log(`Total Attendance (All Time): ${totalAttendance}`);
            if (totalAttendance > 0) {
                const latestAtt = await DailyLog.findOne({ tenant_id: school._id }).sort({ date: -1 });
                console.log(`Latest Attendance Date: ${latestAtt?.date}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
