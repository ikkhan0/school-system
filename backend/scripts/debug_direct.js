const mongoose = require('mongoose');

const uri = "mongodb+srv://imran_db_user:Imran321123@school.ubwky7x.mongodb.net/school_db?retryWrites=true&w=majority&appName=school";

const run = async () => {
    console.log("1. Starting...");
    try {
        await mongoose.connect(uri);
        console.log("2. Connected.");

        // Define minimal schema to avoid model issues
        const studentSchema = new mongoose.Schema({
            full_name: String,
            roll_no: String,
            father_mobile: String,
            emergency_contact: String
        }, { strict: false });

        const Student = mongoose.model('Student_Debug', studentSchema, 'students');

        console.log("3. Querying...");
        const students = await Student.find({ full_name: { $regex: 'Student 18', $options: 'i' } });
        console.log(`Found ${students.length} students.`);

        students.forEach(s => {
            console.log("---");
            console.log("ID:", s._id);
            console.log("Name:", s.full_name);
            console.log("FATHER:", s.father_mobile);
            console.log("MOTHER:", s.mother_mobile);
        });

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        console.log("5. Closing.");
        await mongoose.connection.close();
    }
};

run();
