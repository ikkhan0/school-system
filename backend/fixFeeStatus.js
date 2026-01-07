/**
 * Fix Fee Status Script
 * 
 * This script updates all fee records where:
 * - Balance is 0 but status is NOT 'Paid'
 * 
 * Run this once to fix existing data inconsistencies.
 */

const mongoose = require('mongoose');
const Fee = require('./models/Fee');
require('dotenv').config();

const fixFeeStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_management');
        console.log('✅ Connected to MongoDB');

        // Find all fees where balance is 0 or negative but status is NOT 'Paid'
        const incorrectFees = await Fee.find({
            balance: { $lte: 0 },
            status: { $ne: 'Paid' }
        });

        console.log(`\n📊 Found ${incorrectFees.length} fees with balance <= 0 but status != 'Paid'`);

        if (incorrectFees.length === 0) {
            console.log('✅ All fees have correct status!');
            process.exit(0);
        }

        // Fix each fee
        let fixed = 0;
        for (const fee of incorrectFees) {
            console.log(`\n🔧 Fixing Fee ID: ${fee._id}`);
            console.log(`   Month: ${fee.month}`);
            console.log(`   Old Status: ${fee.status}`);
            console.log(`   Balance: ${fee.balance}`);
            console.log(`   Paid Amount: ${fee.paid_amount}`);

            fee.status = 'Paid';
            await fee.save();

            console.log(`   ✅ New Status: Paid`);
            fixed++;
        }

        console.log(`\n✅ Fixed ${fixed} fee records`);
        console.log('✅ Done!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixFeeStatus();
