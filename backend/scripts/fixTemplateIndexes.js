const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

dotenv.config();

const fixTemplateIndexes = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        const collection = mongoose.connection.collection('whatsapptemplates');

        console.log("Fetching existing indexes...");
        const indexes = await collection.indexes();
        console.log("Current Indexes:", indexes);


        console.log("Dropping all non-default indexes...");
        await collection.dropIndexes();
        console.log("All indexes dropped.");

        // Re-sync from model
        const WhatsappTemplate = require('../models/WhatsappTemplate');
        console.log("Syncing new indexes from model...");
        await WhatsappTemplate.syncIndexes();

        console.log("WhatsappTemplate indexes fixed successfully.");

        process.exit();
    } catch (error) {
        if (error.codeName === 'NamespaceNotFound') {
            console.log("Collection does not exist yet. Indexes will be created on first save.");
            process.exit();
        }
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
};

fixTemplateIndexes();
