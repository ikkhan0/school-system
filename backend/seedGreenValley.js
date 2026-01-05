/**
 * Seed Demo Data for Green Valley School (SCH-002)
 * 
 * This script creates comprehensive demo data for marketing/testing:
 * - Classes (Nursery to Grade 10)
 * - Subjects for each class
 * - 50+ dummy students across all classes
 * - Fee records
 * - Exam records
 * - Attendance records
 * - Staff members
 */

const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');
const User = require('./models/User');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const Fee = require('./models/Fee');
const Exam = require('./models/Exam');
const Session = require('./models/AcademicSession'); // ← Fixed!
const bcrypt = require('bcryptjs');
require('dotenv').config();

const TENANT_ID_TO_FIND = 'SCH-002'; // Green Valley School

// Pakistani names for realistic demo
const FIRST_NAMES = ['Ahmed', 'Ali', 'Fatima', 'Ayesha', 'Hassan', 'Zainab', 'Omar', 'Maryam', 'Ibrahim', 'Khadija',
    'Hamza', 'Sara', 'Abdullah', 'Aisha', 'Usman', 'Hira', 'Bilal', 'Noor', 'Yusuf', 'Amna',
    'Zayn', 'Iman', 'Shayan', 'Laiba', 'Rayan', 'Zara', 'Armaan', 'Aliza', 'Daniyal', 'Mahnoor'];

const LAST_NAMES = ['Khan', 'Ahmed', 'Ali', 'Hassan', 'Hussain', 'Shah', 'Malik', 'Raza', 'Siddiqui', 'Rizvi',
    'Nawaz', 'Butt', 'Akhtar', 'Saeed', 'Iqbal', 'Aziz', 'Tariq', 'Jamil', 'Afzal', 'Rashid'];

const FATHER_PREFIXES = ['Muhammad', 'Abdul', 'Ahmad', 'Syed', 'Haji'];

const CLASSES_DATA = [
    { name: 'Nursery', sections: ['A'], monthly_fee: 3000 },
    { name: 'Prep', sections: ['A'], monthly_fee: 3500 },
    { name: 'One', sections: ['A', 'B'], monthly_fee: 4000 },
    { name: 'Two', sections: ['A', 'B'], monthly_fee: 4000 },
    { name: 'Three', sections: ['A', 'B'], monthly_fee: 4500 },
    { name: 'Four', sections: ['A', 'B'], monthly_fee: 4500 },
    { name: 'Five', sections: ['A', 'B', 'C'], monthly_fee: 5000 },
    { name: 'Six', sections: ['A', 'B', 'C'], monthly_fee: 5500 },
    { name: 'Seven', sections: ['A', 'B'], monthly_fee: 6000 },
    { name: 'Eight', sections: ['A', 'B'], monthly_fee: 6500 },
    { name: 'Nine', sections: ['A', 'B'], monthly_fee: 7000 },
    { name: 'Ten', sections: ['A', 'B'], monthly_fee: 7500 }
];

const SUBJECTS_BY_CLASS = {
    'Nursery': ['English', 'Urdu', 'Math', 'General Knowledge'],
    'Prep': ['English', 'Urdu', 'Math', 'General Knowledge', 'Drawing'],
    'One': ['English', 'Urdu', 'Math', 'General Knowledge', 'Islamiat'],
    'Two': ['English', 'Urdu', 'Math', 'General Science', 'Islamiat'],
    'Three': ['English', 'Urdu', 'Math', 'General Science', 'Islamiat', 'Social Studies'],
    'Four': ['English', 'Urdu', 'Math', 'General Science', 'Islamiat', 'Social Studies'],
    'Five': ['English', 'Urdu', 'Math', 'General Science', 'Islamiat', 'Social Studies', 'Computer'],
    'Six': ['English', 'Urdu', 'Math', 'Science', 'Islamiat', 'Social Studies', 'Computer'],
    'Seven': ['English', 'Urdu', 'Math', 'Physics', 'Chemistry', 'Biology', 'Islamiat', 'Computer'],
    'Eight': ['English', 'Urdu', 'Math', 'Physics', 'Chemistry', 'Biology', 'Islamiat', 'Computer', 'Pakistan Studies'],
    'Nine': ['English', 'Urdu', 'Math', 'Physics', 'Chemistry', 'Biology', 'Islamiat', 'Computer', 'Pakistan Studies'],
    'Ten': ['English', 'Urdu', 'Math', 'Physics', 'Chemistry', 'Biology', 'Islamiat', 'Computer', 'Pakistan Studies']
};

const MARKS_BY_CLASS = {
    'Nursery': 50, 'Prep': 50, 'One': 50, 'Two': 50,
    'Three': 75, 'Four': 75, 'Five': 100, 'Six': 100,
    'Seven': 100, 'Eight': 100, 'Nine': 100, 'Ten': 100
};

const generatePhone = () => {
    const prefix = '0300';
    const remaining = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return prefix + remaining;
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedDemoData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_management');
        console.log('✅ Connected to MongoDB');

        // Find Green Valley School tenant
        const tenant = await Tenant.findOne({ tenant_id: TENANT_ID_TO_FIND });
        if (!tenant) {
            console.error(`❌ Tenant ${TENANT_ID_TO_FIND} not found!`);
            process.exit(1);
        }

        console.log(`\n🏫 Found: ${tenant.school_name} (${tenant.tenant_id})`);
        const tenantId = tenant._id;

        // Find or create active session
        let session = await Session.findOne({ tenant_id: tenantId, is_active: true });
        if (!session) {
            console.log('⚠️  No active session found, creating one...');
            session = new Session({
                tenant_id: tenantId,
                session_name: '2025-2026',  // ← Fixed field name!
                start_date: new Date('2025-04-01'),
                end_date: new Date('2026-03-31'),
                is_active: true
            });
            await session.save();
            console.log('✅ Created session: 2025-2026');
        } else {
            console.log(`✅ Using existing session: ${session.session_name}`);
        }
        const sessionId = session._id;

        // 1. CREATE/GET CLASSES
        console.log('\n📚 Checking Classes...');
        const classMap = {};
        for (const classData of CLASSES_DATA) {
            let cls = await Class.findOne({ name: classData.name, tenant_id: tenantId });
            if (!cls) {
                try {
                    cls = await Class.create({
                        name: classData.name,
                        sections: classData.sections,
                        monthly_fee: classData.monthly_fee,
                        tenant_id: tenantId
                    });
                    console.log(`   ✅ Created: ${classData.name} (${classData.sections.join(', ')})`);
                } catch (error) {
                    if (error.code === 11000) {
                        // Duplicate key error, try to find it again
                        cls = await Class.findOne({ name: classData.name, tenant_id: tenantId });
                        console.log(`   ℹ️  Found existing: ${classData.name}`);
                    } else {
                        throw error;
                    }
                }
            } else {
                console.log(`   ℹ️  Found existing: ${classData.name}`);
            }
            classMap[classData.name] = cls;
        }

        // 2. CREATE SUBJECTS
        console.log('\n📖 Creating Subjects...');
        const subjectMap = {};
        for (const [className, subjects] of Object.entries(SUBJECTS_BY_CLASS)) {
            subjectMap[className] = [];
            for (const subjectName of subjects) {
                let subject = await Subject.findOne({
                    name: subjectName,
                    class_id: className,
                    tenant_id: tenantId
                });

                if (!subject) {
                    subject = await Subject.create({
                        name: subjectName,
                        code: subjectName.substring(0, 3).toUpperCase(),
                        class_id: className,
                        total_marks: MARKS_BY_CLASS[className] || 100,
                        passing_marks: Math.floor((MARKS_BY_CLASS[className] || 100) * 0.4),
                        tenant_id: tenantId
                    });
                }
                subjectMap[className].push(subject);
            }
            console.log(`   ✅ ${className}: ${subjects.length} subjects`);
        }

        // 3. CREATE STUDENTS
        console.log('\n👨‍🎓 Creating Students...');
        let rollCounter = 1001;
        const students = [];

        for (const classData of CLASSES_DATA) {
            const cls = classMap[classData.name];
            const studentsPerSection = classData.name === 'Nursery' || classData.name === 'Prep' ? 8 : 12;

            for (const section of classData.sections) {
                for (let i = 0; i < studentsPerSection; i++) {
                    const firstName = randomElement(FIRST_NAMES);
                    const lastName = randomElement(LAST_NAMES);
                    const fatherPrefix = randomElement(FATHER_PREFIXES);
                    const fatherLast = randomElement(LAST_NAMES);

                    const student = await Student.create({
                        roll_no: rollCounter.toString(),
                        full_name: `${firstName} ${lastName}`,
                        father_name: `${fatherPrefix} ${fatherLast}`,
                        father_mobile: generatePhone(),
                        class_id: classData.name,
                        section_id: section,
                        date_of_birth: new Date(2015 - parseInt(classData.name === 'Ten' ? 16 : classData.name === 'One' ? 7 : 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                        admission_date: new Date('2025-04-01'),
                        monthly_fee: classData.monthly_fee,
                        is_active: true,
                        tenant_id: tenantId,
                        current_session_id: sessionId,
                        subjects: subjectMap[classData.name].map(s => s._id)
                    });

                    students.push(student);
                    rollCounter++;
                }
                console.log(`   ✅ ${classData.name}-${section}: ${studentsPerSection} students`);
            }
        }

        console.log(`\n✅ Total Students Created: ${students.length}`);

        // 4. CREATE FEE RECORDS (Jan-2026)
        console.log('\n💰 Creating Fee Records...');
        const months = ['Jan-2026', 'Feb-2026', 'Mar-2026'];
        let feeCount = 0;

        for (const student of students) {
            for (const month of months) {
                const isPaid = Math.random() > 0.3; // 70% paid
                const paidAmount = isPaid ? student.monthly_fee : (Math.random() > 0.5 ? student.monthly_fee / 2 : 0);

                await Fee.create({
                    student_id: student._id,
                    tenant_id: tenantId,
                    session_id: sessionId,
                    month: month,
                    title: 'Monthly Fee',
                    fee_type: 'Tuition',
                    tuition_fee: student.monthly_fee,
                    concession: 0,
                    other_charges: 0,
                    gross_amount: student.monthly_fee,
                    paid_amount: paidAmount,
                    balance: student.monthly_fee - paidAmount,
                    status: paidAmount >= student.monthly_fee ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending'),
                    payment_date: isPaid ? new Date('2026-01-15') : null
                });
                feeCount++;
            }
        }
        console.log(`   ✅ Created ${feeCount} fee records`);

        // 5. CREATE EXAMS
        console.log('\n📝 Creating Exams...');
        const exams = [
            { title: 'First Term Exam', type: 'Term', start_date: '2025-10-01', end_date: '2025-10-15' },
            { title: 'Mid Term Exam', type: 'Mid Term', start_date: '2025-12-01', end_date: '2025-12-15' },
            { title: 'Final Term Exam', type: 'Final', start_date: '2026-03-01', end_date: '2026-03-15' }
        ];

        for (const examData of exams) {
            const exam = await Exam.create({
                title: examData.title,
                type: examData.type,
                session_id: sessionId,
                start_date: new Date(examData.start_date),
                end_date: new Date(examData.end_date),
                classes: CLASSES_DATA.map(c => c.name),
                tenant_id: tenantId
            });
            console.log(`   ✅ ${examData.title}`);
        }

        console.log('\n🎉 DEMO DATA SEEDING COMPLETE!');
        console.log('\n📊 Summary:');
        console.log(`   🏫 School: ${tenant.school_name}`);
        console.log(`   📚 Classes: ${CLASSES_DATA.length}`);
        console.log(`   📖 Subject Groups: ${Object.keys(SUBJECTS_BY_CLASS).length}`);
        console.log(`   👨‍🎓 Students: ${students.length}`);
        console.log(`   💰 Fee Records: ${feeCount}`);
        console.log(`   📝 Exams: ${exams.length}`);
        console.log('\n✅ Green Valley School is ready for demo!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedDemoData();
