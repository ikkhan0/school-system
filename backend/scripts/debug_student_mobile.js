const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('../models/Student');
const connectDB = require('../config/db');

const debugStudent = async () => {
    try {
        await connectDB();

        console.log("Searching for Roll No 18...");

        const students = await Student.find({ roll_no: '18' });

        console.log(`Found ${students.length} students with Roll No 18.`);

        students.forEach(s => {
            console.log('--- STUDENT ---');
            console.log(`ID: ${s._id}`);
            console.log(`Name: ${s.full_name}`);
            console.log(`Father Mobile: '${s.father_mobile}'`);
            console.log(`Mother Mobile: '${s.mother_mobile}'`);
            console.log(`Student Mobile: '${s.student_mobile}'`);
            console.log(`Emergency: '${s.emergency_contact}'`);
            console.log('----------------');
        });

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugStudent();
