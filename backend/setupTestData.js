const mongoose = require('mongoose');
const Student = require('./models/Student');
const Staff = require('./models/Staff');
const Family = require('./models/Family');
const DiscountPolicy = require('./models/DiscountPolicy');
const Fee = require('./models/Fee');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

async function setupTestData() {
    try {
        console.log('\n🚀 Setting up test data for discount and family messaging system...\n');

        // Get school_id from first user or use a default
        const User = require('./models/User');
        const user = await User.findOne();
        if (!user) {
            console.error('❌ No user found. Please create a user first.');
            process.exit(1);
        }
        const school_id = user.school_id;

        // 1. Create Discount Policies
        console.log('📋 Creating Discount Policies...');

        await DiscountPolicy.deleteMany({ school_id, policy_name: { $in: ['Staff Child Discount', '2nd Sibling Discount', '3rd Sibling Discount'] } });

        const staffChildPolicy = await DiscountPolicy.create({
            school_id,
            policy_name: 'Staff Child Discount',
            policy_type: 'Staff Child',
            discount_mode: 'Percentage',
            discount_percentage: 20,
            discount_amount: 0,
            is_active: true,
            description: 'Automatic 20% discount for staff children'
        });
        console.log('  ✅ Staff Child Discount: 20%');

        const sibling2Policy = await DiscountPolicy.create({
            school_id,
            policy_name: '2nd Sibling Discount',
            policy_type: 'Sibling',
            discount_mode: 'Percentage',
            discount_percentage: 10,
            discount_amount: 0,
            is_active: true,
            conditions: { sibling_position: 2 },
            description: 'Automatic 10% discount for 2nd child in family'
        });
        console.log('  ✅ 2nd Sibling Discount: 10%');

        const sibling3Policy = await DiscountPolicy.create({
            school_id,
            policy_name: '3rd Sibling Discount',
            policy_type: 'Sibling',
            discount_mode: 'Percentage',
            discount_percentage: 15,
            discount_amount: 0,
            is_active: true,
            conditions: { sibling_position: 3 },
            description: 'Automatic 15% discount for 3rd child in family'
        });
        console.log('  ✅ 3rd Sibling Discount: 15%\n');

        // 2. Create a Staff Member
        console.log('👨‍🏫 Creating Staff Member...');

        await Staff.deleteMany({ school_id, employee_id: 'STAFF001' });

        const staff = await Staff.create({
            school_id,
            full_name: 'Ahmed Khan',
            employee_id: 'STAFF001',
            cnic: '12345-1234567-1',
            mobile: '03001234567',
            designation: 'Teacher',
            department: 'Academic',
            joining_date: new Date('2020-01-01'),
            employment_type: 'Permanent',
            basic_salary: 50000
        });
        console.log(`  ✅ Staff: ${staff.full_name} (${staff.employee_id})\n`);

        // 3. Create a Family
        console.log('👨‍👩‍👧‍👦 Creating Family...');

        await Family.deleteMany({ school_id, father_mobile: '03009876543' });

        const family = await Family.create({
            school_id,
            father_name: 'Muhammad Ali',
            father_mobile: '03009876543',
            father_cnic: '42101-1234567-1',
            mother_name: 'Fatima Ali',
            mother_mobile: '03009876544',
            whatsapp_number: '03009876543',
            address: 'House 123, Street 5, Islamabad',
            total_children: 3
        });
        console.log(`  ✅ Family: ${family.father_name} (${family.father_mobile})\n`);

        // 4. Create 3 Sibling Students
        console.log('👨‍🎓 Creating 3 Sibling Students...');

        await Student.deleteMany({
            school_id,
            roll_no: { $in: ['2025-001', '2025-002', '2025-003'] }
        });

        const student1 = await Student.create({
            school_id,
            family_id: family._id,
            roll_no: '2025-001',
            full_name: 'Hassan Ali',
            father_name: family.father_name,
            father_mobile: family.father_mobile,
            mother_name: family.mother_name,
            mother_mobile: family.mother_mobile,
            class_id: '5',
            section_id: 'A',
            monthly_fee: 5000,
            admission_date: new Date('2020-04-01'),
            sibling_discount_position: 1,
            is_active: true
        });
        console.log(`  ✅ 1st Child: ${student1.full_name} (${student1.roll_no}) - Class ${student1.class_id}-${student1.section_id}`);

        const student2 = await Student.create({
            school_id,
            family_id: family._id,
            roll_no: '2025-002',
            full_name: 'Ayesha Ali',
            father_name: family.father_name,
            father_mobile: family.father_mobile,
            mother_name: family.mother_name,
            mother_mobile: family.mother_mobile,
            class_id: '3',
            section_id: 'B',
            monthly_fee: 4500,
            admission_date: new Date('2022-04-01'),
            sibling_discount_position: 2,
            is_active: true
        });
        console.log(`  ✅ 2nd Child: ${student2.full_name} (${student2.roll_no}) - Class ${student2.class_id}-${student2.section_id}`);

        const student3 = await Student.create({
            school_id,
            family_id: family._id,
            roll_no: '2025-003',
            full_name: 'Zainab Ali',
            father_name: family.father_name,
            father_mobile: family.father_mobile,
            mother_name: family.mother_name,
            mother_mobile: family.mother_mobile,
            class_id: '1',
            section_id: 'A',
            monthly_fee: 4000,
            admission_date: new Date('2024-04-01'),
            sibling_discount_position: 3,
            is_active: true
        });
        console.log(`  ✅ 3rd Child: ${student3.full_name} (${student3.roll_no}) - Class ${student3.class_id}-${student3.section_id}\n`);

        // Update siblings array for all students
        await Student.updateOne({ _id: student1._id }, { siblings: [student2._id, student3._id] });
        await Student.updateOne({ _id: student2._id }, { siblings: [student1._id, student3._id] });
        await Student.updateOne({ _id: student3._id }, { siblings: [student1._id, student2._id] });

        // 5. Create a Staff Child Student
        console.log('👨‍🎓 Creating Staff Child Student...');

        await Student.deleteMany({ school_id, roll_no: '2025-STAFF001' });

        const staffChild = await Student.create({
            school_id,
            staff_parent_id: staff._id,
            is_staff_child: true,
            roll_no: '2025-STAFF001',
            full_name: 'Sara Khan',
            father_name: staff.full_name,
            father_mobile: staff.mobile,
            class_id: '4',
            section_id: 'A',
            monthly_fee: 5000,
            admission_date: new Date('2021-04-01'),
            discount_category: 'Staff Child',
            is_active: true
        });
        console.log(`  ✅ Staff Child: ${staffChild.full_name} (${staffChild.roll_no}) - Parent: ${staff.full_name}\n`);

        // 6. Apply Auto-Discounts
        console.log('💰 Applying Auto-Discounts...');

        const { calculateAutoDiscounts } = require('./utils/discountCalculator');

        // Apply to siblings
        for (const student of [student1, student2, student3]) {
            const result = await calculateAutoDiscounts(student);
            if (result.success) {
                student.auto_discount_applied = {
                    is_enabled: true,
                    policies_applied: result.applied_discounts,
                    total_auto_discount_percentage: result.total_discount_percentage,
                    last_calculated: new Date()
                };
                if (result.applied_discounts.length > 0) {
                    student.discount_category = 'Sibling';
                }
                await student.save();
                console.log(`  ✅ ${student.full_name}: ${result.total_discount_percentage}% discount`);
            }
        }

        // Apply to staff child
        const staffChildResult = await calculateAutoDiscounts(staffChild);
        if (staffChildResult.success) {
            staffChild.auto_discount_applied = {
                is_enabled: true,
                policies_applied: staffChildResult.applied_discounts,
                total_auto_discount_percentage: staffChildResult.total_discount_percentage,
                last_calculated: new Date()
            };
            await staffChild.save();
            console.log(`  ✅ ${staffChild.full_name}: ${staffChildResult.total_discount_percentage}% discount\n`);
        }

        // 7. Create Fee Records
        console.log('💵 Creating Fee Records...');

        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        await Fee.deleteMany({
            school_id,
            student_id: { $in: [student1._id, student2._id, student3._id, staffChild._id] },
            month: currentMonth
        });

        const createFee = async (student) => {
            const discount = student.auto_discount_applied?.total_auto_discount_percentage || 0;
            const discountAmount = (student.monthly_fee * discount) / 100;

            return await Fee.create({
                school_id,
                student_id: student._id,
                month: currentMonth,
                tuition_fee: student.monthly_fee,
                other_charges: 1500,
                arrears: Math.random() > 0.5 ? 2000 : 0,
                discount_applied: {
                    policy_discount: discountAmount,
                    total_discount: discountAmount
                },
                gross_amount: student.monthly_fee + 1500 - discountAmount,
                paid_amount: 0,
                balance: student.monthly_fee + 1500 - discountAmount,
                status: 'Pending'
            });
        };

        await createFee(student1);
        await createFee(student2);
        await createFee(student3);
        await createFee(staffChild);

        console.log(`  ✅ Created fee records for ${currentMonth}\n`);

        // Summary
        console.log('✅ TEST DATA SETUP COMPLETE!\n');
        console.log('📊 Summary:');
        console.log(`  - 3 Discount Policies created`);
        console.log(`  - 1 Staff member created: ${staff.full_name}`);
        console.log(`  - 1 Family created: ${family.father_name}`);
        console.log(`  - 3 Sibling students created`);
        console.log(`  - 1 Staff child student created`);
        console.log(`  - Auto-discounts applied`);
        console.log(`  - Fee records created for ${currentMonth}\n`);

        console.log('🎯 Next Steps:');
        console.log('  1. Navigate to "Siblings" in the navbar');
        console.log('  2. View confirmed families and suggested groups');
        console.log('  3. Navigate to "WhatsApp" to send family messages');
        console.log('  4. Test the WhatsApp message generation\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up test data:', error);
        process.exit(1);
    }
}

setupTestData();
