const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Student = require('../models/Student');

async function checkStudentSubjects() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all students
        const students = await Student.find({ is_active: true })
            .populate('enrolled_subjects.subject_id')
            .limit(10);

        console.log(`\n📊 Found ${students.length} students\n`);

        students.forEach((student, index) => {
            console.log(`${index + 1}. ${student.full_name} (${student.roll_no}) - Class ${student.class_id}-${student.section_id}`);
            console.log(`   Enrolled Subjects (${student.enrolled_subjects?.length || 0}):`);

            if (student.enrolled_subjects && student.enrolled_subjects.length > 0) {
                student.enrolled_subjects.forEach(es => {
                    console.log(`   - ${es.subject_id?.name || 'Unknown'} (ID: ${es.subject_id?._id || 'Not populated'}, Active: ${es.is_active})`);
                });
            } else {
                console.log('   ❌ NO SUBJECTS ASSIGNED');
            }
            console.log('');
        });

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkStudentSubjects();
