const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');
const connectDB = require('../config/db');

dotenv.config();

const findMissingStudents = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        const rollNos = ['9P1'];

        const students = await Student.find({
            roll_no: { $in: rollNos }
        });

        console.log(`Found ${students.length} students with these roll numbers.`);

        students.forEach(s => {
            console.log(`FOUND: ${s.full_name} | Roll: ${s.roll_no} | Class: ${s.class_id} | Section: ${s.section_id}`);
        });

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

findMissingStudents();
