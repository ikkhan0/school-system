const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

dotenv.config();

const fixIndexes = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        const collection = mongoose.connection.collection('students');

        console.log("Fetching existing indexes...");
        const indexes = await collection.indexes();
        console.log(indexes);

        // Find the index with name 'roll_no_1' (default name for single field unique index)
        const rollNoIndex = indexes.find(idx => idx.key.roll_no === 1 && Object.keys(idx.key).length === 1);

        if (rollNoIndex) {
            console.log(`Dropping index: ${rollNoIndex.name}`);
            await collection.dropIndex(rollNoIndex.name);
            console.log("Index dropped successfully.");
        } else {
            console.log("Legacy roll_no index not found.");
        }

        // Mongoose will create the new index on restart, or we can force it
        const Student = require('../models/Student');
        await Student.syncIndexes();
        console.log("Indexes synced successfully.");

        process.exit();
    } catch (error) {
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
};

fixIndexes();
