const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const DiscountPolicy = require('./models/DiscountPolicy');
const School = require('./models/School');

dotenv.config();

const seedDiscountPolicies = async () => {
    try {
        await connectDB();
        console.log('DB Connected');

        // Get all schools
        const schools = await School.find({});

        if (schools.length === 0) {
            console.log('No schools found! Please run seed.js first to create schools.');
            process.exit(1);
        }

        console.log(`Found ${schools.length} school(s)`);

        for (const school of schools) {
            console.log(`\nSeeding discount policies for: ${school.name}`);

            // Clear existing discount policies for this school
            await DiscountPolicy.deleteMany({ school_id: school._id });
            console.log('  - Existing policies cleared');

            // Default discount policies
            const defaultPolicies = [
                {
                    policy_name: 'Staff Child Discount',
                    description: 'Discount for children of staff members',
                    policy_type: 'Staff Child',
                    discount_mode: 'Percentage',
                    discount_percentage: 25,
                    discount_amount: 0,
                    is_active: true,
                    school_id: school._id
                },
                {
                    policy_name: 'Sibling Discount - 2nd Child',
                    description: '10% discount for second child in family',
                    policy_type: 'Sibling',
                    discount_mode: 'Percentage',
                    discount_percentage: 10,
                    discount_amount: 0,
                    is_active: true,
                    conditions: {
                        sibling_position: 2
                    },
                    school_id: school._id
                },
                {
                    policy_name: 'Sibling Discount - 3rd Child',
                    description: '15% discount for third child in family',
                    policy_type: 'Sibling',
                    discount_mode: 'Percentage',
                    discount_percentage: 15,
                    discount_amount: 0,
                    is_active: true,
                    conditions: {
                        sibling_position: 3
                    },
                    school_id: school._id
                },
                {
                    policy_name: 'Sibling Discount - 4th+ Child',
                    description: '20% discount for fourth child and beyond',
                    policy_type: 'Sibling',
                    discount_mode: 'Percentage',
                    discount_percentage: 20,
                    discount_amount: 0,
                    is_active: true,
                    conditions: {
                        sibling_position: 4
                    },
                    school_id: school._id
                },
                {
                    policy_name: 'Merit Scholarship',
                    description: 'Merit-based scholarship for top performers',
                    policy_type: 'Merit',
                    discount_mode: 'Percentage',
                    discount_percentage: 30,
                    discount_amount: 0,
                    is_active: true,
                    school_id: school._id
                },
                {
                    policy_name: 'Financial Aid',
                    description: 'Need-based financial assistance',
                    policy_type: 'Financial Aid',
                    discount_mode: 'Percentage',
                    discount_percentage: 50,
                    discount_amount: 0,
                    is_active: true,
                    school_id: school._id
                }
            ];

            const created = await DiscountPolicy.insertMany(defaultPolicies);
            console.log(`  ✅ Created ${created.length} discount policies`);

            created.forEach(policy => {
                console.log(`     - ${policy.name} (${policy.discount_percentage}%)`);
            });
        }

        console.log('\n✅ Discount Policies Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding discount policies:', error);
        process.exit(1);
    }
};

seedDiscountPolicies();
