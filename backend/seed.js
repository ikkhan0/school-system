const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // Needed for user password
const connectDB = require('./config/db');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Fee = require('./models/Fee');
const Family = require('./models/Family');
const School = require('./models/School');
const User = require('./models/User');
const Exam = require('./models/Exam');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();
        console.log('DB Connected');

        // Clear existing data
        await School.deleteMany({});
        await User.deleteMany({});
        await Class.deleteMany({});
        await Student.deleteMany({});
        await Fee.deleteMany({});
        await Family.deleteMany({});
        console.log('Existing data cleared');

        // 1. Create School
        const school = await School.create({
            name: 'Bismillah Educational Complex',
            address: '123 Education St, Knowledge City',
            phone: '0300-1234567',
            settings: { currency: 'PKR', session_year: '2025' }
        });
        console.log('School Created:', school.name);

        // 2. Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt);

        const adminUser = await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'school_admin',
            school_id: school._id,
            full_name: 'School Administrator'
        });
        console.log('Admin User Created: admin / admin');

        // 3. Create Classes
        const classes = [];
        for (let i = 1; i <= 10; i++) {
            classes.push({
                name: `Class ${i}`,
                sections: ['A', 'B'],
                school_id: school._id
            });
        }
        const createdClasses = await Class.insertMany(classes);
        console.log('Classes created');

        // 4. Create Families
        const families = [];
        for (let i = 0; i < 5; i++) {
            families.push({
                father_name: `Father ${i + 1}`,
                father_cnic: `35202-1234567-${i}`,
                father_mobile: `0300-111222${i}`,
                school_id: school._id
            });
        }
        const createdFamilies = await Family.insertMany(families);

        // 5. Create Students
        const students = [];
        for (let i = 0; i < 20; i++) {
            const randomClass = createdClasses[Math.floor(Math.random() * createdClasses.length)];
            const randomSection = randomClass.sections[Math.floor(Math.random() * randomClass.sections.length)];
            const randomFamily = createdFamilies[Math.floor(Math.random() * createdFamilies.length)];

            students.push({
                full_name: `Student ${i + 1}`,
                roll_no: `R-${100 + i}`,
                class_id: randomClass.name, // Keeping simple string as per previous logic, or use ObjID? sticking to string for now to match UI
                section_id: randomSection,
                category: 'Regular',
                is_active: true,
                family_id: randomFamily._id,
                father_name: randomFamily.father_name, // Denormalized
                monthly_fee: 3000 + Math.floor(Math.random() * 5) * 500, // Random fee between 3000 and 5000
                school_id: school._id
            });
        }
        const createdStudents = await Student.insertMany(students);
        console.log('Students created');

        // 6. Create Fees
        const fees = [];
        for (const student of createdStudents) {
            fees.push({
                student_id: student._id,
                school_id: school._id,
                month: 'Dec-2025', // Updated to current month context
                tuition_fee: 5000,
                gross_amount: 5000,
                paid_amount: 2500, // Partial payment
                balance: 2500,
                status: 'Partial',
                payment_date: new Date(),
                description: 'Monthly Tuition Fee'
            });
        }
        await Fee.insertMany(fees);
        console.log('Fees created');

        // 7. Create Daily Logs (Attendance)
        // Scenario: 20 students. 
        // 15 Present, 3 Absent (Today), 2 Leave
        // Also create 3-day absents for a specific student to test warnings

        const DailyLog = require('./models/DailyLog'); // Ensure model is loaded
        await DailyLog.deleteMany({});

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight
        const logs = [];

        createdStudents.forEach((student, index) => {
            let status = 'Present';
            if (index < 3) status = 'Absent'; // First 3 absent
            else if (index < 5) status = 'Leave'; // Next 2 on leave

            logs.push({
                student_id: student._id,
                date: today,
                status: status,
                school_id: school._id // Assuming Logs might need school context, though schema didn't explicitly demand it, it's safer if updated later. (Schema check: DailyLog doesn't have school_id, skipping)
            });
        });

        // Add 3-day history for the first student (Student 1) to trigger warning
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const dayBefore = new Date(today); dayBefore.setDate(dayBefore.getDate() - 2);

        logs.push({ student_id: createdStudents[0]._id, date: yesterday, status: 'Absent' });
        logs.push({ student_id: createdStudents[0]._id, date: dayBefore, status: 'Absent' });

        await DailyLog.insertMany(logs);
        console.log('Daily Logs (Attendance) created');

        // 7. Create Exams
        const exam = await Exam.create({
            school_id: school._id,
            title: 'Mid Term 2025',
            start_date: new Date('2025-03-01'),
            end_date: new Date('2025-03-15'),
            is_active: true
        });
        console.log('Exam Created: Mid Term 2025');

        console.log('Data Seeding Complete!');
        process.exit();
    } catch (error) {
        console.error('Error with data seeding:', error);
        process.exit(1);
    }
};

seedData();
