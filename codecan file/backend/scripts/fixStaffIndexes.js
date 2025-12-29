const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

dotenv.config();

const fixStaffIndexes = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        const collection = mongoose.connection.collection('staffattendances');

        console.log("Fetching existing indexes...");
        const indexes = await collection.indexes();
        console.log("Current Indexes:", indexes);

        // Drop all indexes except _id
        console.log("Dropping all non-default indexes...");
        await collection.dropIndexes();
        console.log("All indexes dropped.");

        // Re-sync from model
        const StaffAttendance = require('../models/StaffAttendance');
        console.log("Syncing new indexes from model...");
        await StaffAttendance.syncIndexes();

        console.log("Staff Attendance indexes fixed successfully.");

        process.exit();
    } catch (error) {
        // If collection doesn't exist, it might be first run
        if (error.codeName === 'NamespaceNotFound') {
            console.log("Collection does not exist yet. Indexes will be created on first save.");
            process.exit();
        }
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
};

fixStaffIndexes();
