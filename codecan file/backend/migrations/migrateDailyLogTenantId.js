require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const DailyLog = require('../models/DailyLog');
const Student = require('../models/Student');

// MongoDB connection string - use environment variable
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables!');
    console.log('Please ensure .env file exists with MONGO_URI defined.');
    process.exit(1);
}

async function migrateDailyLogTenantId() {
    try {
        console.log('🔄 Starting DailyLog tenant_id migration...\n');

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all DailyLog records without tenant_id
        const logsWithoutTenant = await DailyLog.find({
            $or: [
                { tenant_id: { $exists: false } },
                { tenant_id: null }
            ]
        });

        console.log(`📊 Found ${logsWithoutTenant.length} DailyLog records without tenant_id\n`);

        if (logsWithoutTenant.length === 0) {
            console.log('✅ All DailyLog records already have tenant_id. Migration not needed.\n');
            await mongoose.connection.close();
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process each log record
        for (const log of logsWithoutTenant) {
            try {
                // Find the student to get their tenant_id
                const student = await Student.findById(log.student_id);

                if (!student) {
                    console.warn(`⚠️  Student not found for log ${log._id}, skipping...`);
                    errorCount++;
                    errors.push({ log_id: log._id, reason: 'Student not found' });
                    continue;
                }

                // Get tenant_id from student (with fallback to school_id)
                const tenantId = student.tenant_id || student.school_id;

                if (!tenantId) {
                    console.warn(`⚠️  No tenant_id or school_id found for student ${student._id}, skipping log ${log._id}...`);
                    errorCount++;
                    errors.push({ log_id: log._id, student_id: student._id, reason: 'No tenant_id available' });
                    continue;
                }

                // Update the DailyLog record
                await DailyLog.updateOne(
                    { _id: log._id },
                    { $set: { tenant_id: tenantId } }
                );

                successCount++;

                // Log progress every 50 records
                if (successCount % 50 === 0) {
                    console.log(`✅ Migrated ${successCount} records...`);
                }
            } catch (error) {
                console.error(`❌ Error migrating log ${log._id}:`, error.message);
                errorCount++;
                errors.push({ log_id: log._id, reason: error.message });
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully migrated: ${successCount} records`);
        console.log(`❌ Errors: ${errorCount} records`);
        console.log(`📝 Total processed: ${logsWithoutTenant.length} records`);

        if (errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            errors.slice(0, 10).forEach(err => {
                console.log(`   - Log ID: ${err.log_id}, Reason: ${err.reason}`);
            });
            if (errors.length > 10) {
                console.log(`   ... and ${errors.length - 10} more errors`);
            }
        }

        // Verify migration
        const remainingWithoutTenant = await DailyLog.countDocuments({
            $or: [
                { tenant_id: { $exists: false } },
                { tenant_id: null }
            ]
        });

        console.log(`\n🔍 Verification: ${remainingWithoutTenant} records still without tenant_id`);

        if (remainingWithoutTenant === 0) {
            console.log('✅ Migration completed successfully! All records have tenant_id.\n');
        } else {
            console.log('⚠️  Some records still need migration. Review errors above.\n');
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run migration
migrateDailyLogTenantId();
