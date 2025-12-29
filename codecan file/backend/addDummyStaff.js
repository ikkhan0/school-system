// Run this script with: node backend/addDummyStaff.js
const mongoose = require('mongoose');

// MongoDB connection string - replace with your actual connection string
const MONGO_URI = process.env.MONGO_URI || 'your-mongodb-connection-string';

const staffSchema = new mongoose.Schema({
    school_id: mongoose.Schema.Types.ObjectId,
    full_name: String,
    employee_id: String,
    cnic: String,
    dob: Date,
    gender: String,
    mobile: String,
    email: String,
    current_address: String,
    city: String,
    blood_group: String,
    religion: String,
    designation: String,
    department: String,
    joining_date: Date,
    employment_type: String,
    basic_salary: Number,
    allowances: {
        house_rent: Number,
        medical: Number,
        transport: Number,
        other: Number
    },
    assigned_subjects: [{
        subject_id: mongoose.Schema.Types.ObjectId
    }],
    bank_name: String,
    account_number: String,
    emergency_contact_name: String,
    emergency_contact_mobile: String,
    is_active: Boolean
}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);
const User = mongoose.model('User', new mongoose.Schema({
    school_id: mongoose.Schema.Types.ObjectId
}));
const Subject = mongoose.model('Subject', new mongoose.Schema({
    school_id: mongoose.Schema.Types.ObjectId
}));

async function addDummyStaff() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get school_id from first user
        const user = await User.findOne();
        if (!user) {
            console.log('❌ No user found. Please create a user first.');
            process.exit(1);
        }
        const school_id = user.school_id;
        console.log(`📍 Using school_id: ${school_id}`);

        // Get subjects for teachers
        const subjects = await Subject.find({ school_id }).limit(3);
        const subjectIds = subjects.map(s => s._id);
        console.log(`📚 Found ${subjects.length} subjects`);

        const dummyStaff = [
            {
                school_id,
                full_name: 'Ahmed Khan',
                employee_id: 'EMP-001',
                cnic: '12345-1234567-1',
                dob: new Date('1985-05-15'),
                gender: 'Male',
                mobile: '03001234567',
                email: 'ahmed.khan@school.com',
                current_address: 'House 123, Model Town, Lahore',
                city: 'Lahore',
                blood_group: 'B+',
                religion: 'Islam',
                designation: 'Teacher',
                department: 'Academic',
                joining_date: new Date('2020-01-15'),
                employment_type: 'Permanent',
                basic_salary: 45000,
                allowances: { house_rent: 10000, medical: 3000, transport: 2000, other: 0 },
                assigned_subjects: subjectIds.length > 0 ? subjectIds.slice(0, 2).map(id => ({ subject_id: id })) : [],
                bank_name: 'HBL',
                account_number: '12345678901234',
                emergency_contact_name: 'Fatima Khan',
                emergency_contact_mobile: '03009876543',
                is_active: true
            },
            {
                school_id,
                full_name: 'Sarah Ali',
                employee_id: 'EMP-002',
                cnic: '12345-7654321-2',
                dob: new Date('1990-08-22'),
                gender: 'Female',
                mobile: '03112345678',
                email: 'sarah.ali@school.com',
                current_address: 'Flat 45, Johar Town, Lahore',
                city: 'Lahore',
                blood_group: 'A+',
                religion: 'Islam',
                designation: 'Subject Teacher',
                department: 'Academic',
                joining_date: new Date('2021-03-10'),
                employment_type: 'Permanent',
                basic_salary: 40000,
                allowances: { house_rent: 8000, medical: 2500, transport: 1500, other: 0 },
                assigned_subjects: subjectIds.length > 0 ? [{ subject_id: subjectIds[0] }] : [],
                bank_name: 'MCB',
                account_number: '98765432109876',
                emergency_contact_name: 'Hassan Ali',
                emergency_contact_mobile: '03221234567',
                is_active: true
            },
            {
                school_id,
                full_name: 'Muhammad Usman',
                employee_id: 'EMP-003',
                cnic: '12345-1111111-3',
                dob: new Date('1978-12-10'),
                gender: 'Male',
                mobile: '03331234567',
                email: 'usman@school.com',
                current_address: 'House 789, DHA Phase 5, Lahore',
                city: 'Lahore',
                blood_group: 'O+',
                religion: 'Islam',
                designation: 'Principal',
                department: 'Management',
                joining_date: new Date('2015-08-01'),
                employment_type: 'Permanent',
                basic_salary: 80000,
                allowances: { house_rent: 20000, medical: 5000, transport: 3000, other: 0 },
                assigned_subjects: [],
                bank_name: 'UBL',
                account_number: '11111111111111',
                emergency_contact_name: 'Ayesha Usman',
                emergency_contact_mobile: '03441234567',
                is_active: true
            },
            {
                school_id,
                full_name: 'Zainab Malik',
                employee_id: 'EMP-004',
                cnic: '12345-2222222-4',
                dob: new Date('1988-03-25'),
                gender: 'Female',
                mobile: '03451234567',
                email: 'zainab.malik@school.com',
                current_address: 'House 456, Garden Town, Lahore',
                city: 'Lahore',
                blood_group: 'AB+',
                religion: 'Islam',
                designation: 'Librarian',
                department: 'Support',
                joining_date: new Date('2019-09-15'),
                employment_type: 'Permanent',
                basic_salary: 30000,
                allowances: { house_rent: 5000, medical: 2000, transport: 1000, other: 0 },
                assigned_subjects: [],
                bank_name: 'Allied Bank',
                account_number: '22222222222222',
                emergency_contact_name: 'Bilal Malik',
                emergency_contact_mobile: '03561234567',
                is_active: true
            },
            {
                school_id,
                full_name: 'Imran Ahmed',
                employee_id: 'EMP-005',
                cnic: '12345-3333333-5',
                dob: new Date('1995-07-18'),
                gender: 'Male',
                mobile: '03671234567',
                email: 'imran.ahmed@school.com',
                current_address: 'House 321, Gulberg III, Lahore',
                city: 'Lahore',
                blood_group: 'B-',
                religion: 'Islam',
                designation: 'Peon',
                department: 'Support',
                joining_date: new Date('2022-01-20'),
                employment_type: 'Permanent',
                basic_salary: 20000,
                allowances: { house_rent: 3000, medical: 1000, transport: 500, other: 0 },
                assigned_subjects: [],
                bank_name: 'Meezan Bank',
                account_number: '33333333333333',
                emergency_contact_name: 'Sana Ahmed',
                emergency_contact_mobile: '03781234567',
                is_active: true
            }
        ];

        console.log('🌱 Creating staff members...');
        const created = await Staff.insertMany(dummyStaff);

        console.log('\n✅ Successfully created 5 dummy staff members:');
        created.forEach(staff => {
            console.log(`   ✓ ${staff.full_name} (${staff.designation}) - ${staff.employee_id}`);
        });

        console.log('\n📊 Summary:');
        console.log('   • 2 Teachers (Ahmed Khan, Sarah Ali)');
        console.log('   • 1 Principal (Muhammad Usman)');
        console.log('   • 1 Librarian (Zainab Malik)');
        console.log('   • 1 Peon (Imran Ahmed)');

        console.log('\n✨ Done! Check your staff list at: https://soft-school-management.vercel.app/staff');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

addDummyStaff();
