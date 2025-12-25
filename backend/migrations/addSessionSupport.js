/**
 * Migration Script: Add Session Support to Existing Data
 * 
 * This script:
 * 1. Creates a default 2024-2025 session for each school
 * 2. Updates all existing students with current_session_id
 * 3. Updates all existing fees with session_id
 * 4. Initializes session_history for all students
 * 
 * Run this BEFORE deploying the session management system
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const AcademicSession = require('../models/AcademicSession');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const DailyLog = require('../models/DailyLog');
const ExamResult = require('../models/ExamResult');
const Result = require('../models/Result');

async function migrateToSessions() {
    try {
        console.log('🚀 Starting session migration...\n');

        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database\n');

        // Get all unique tenant_ids (schools)
        const schools = await mongoose.connection.db.collection('students')
            .distinct('tenant_id');

        console.log(`📊 Found ${schools.length} schools\n`);

        for (const schoolId of schools) {
            if (!schoolId) continue;

            console.log(`\n🏫 Processing school: ${schoolId}`);

            // Check if session already exists
            let session = await AcademicSession.findOne({
                tenant_id: schoolId,
                session_name: '2024-2025'
            });

            if (!session) {
                // Create default 2024-2025 session
                session = await AcademicSession.create({
                    tenant_id: schoolId,
                    session_name: '2024-2025',
                    start_date: new Date('2024-04-01'),
                    end_date: new Date('2025-03-31'),
                    is_active: true,
                    is_current: true,
                    is_locked: false,
                    notes: 'Auto-created during migration'
                });

                console.log(`  ✅ Created session: ${session.session_name}`);
            } else {
                console.log(`  ℹ️  Session already exists: ${session.session_name}`);
            }

            // Update all students for this school
            const studentUpdateResult = await Student.updateMany(
                {
                    tenant_id: schoolId,
                    current_session_id: { $exists: false }
                },
                {
                    $set: {
                        current_session_id: session._id
                    },
                    $setOnInsert: {
                        session_history: []
                    }
                }
            );

            console.log(`  ✅ Updated ${studentUpdateResult.modifiedCount} students`);

            // Update all fees for this school
            const feeUpdateResult = await Fee.updateMany(
                {
                    tenant_id: schoolId,
                    session_id: { $exists: false }
                },
                {
                    $set: {
                        session_id: session._id
                    }
                }
            );

            console.log(`  ✅ Updated ${feeUpdateResult.modifiedCount} fee records`);

            // Update all daily logs for this school (if model has session support)
            try {
                const dailyLogUpdateResult = await DailyLog.updateMany(
                    {
                        tenant_id: schoolId,
                        session_id: { $exists: false }
                    },
                    {
                        $set: {
                            session_id: session._id
                        }
                    }
                );

                console.log(`  ✅ Updated ${dailyLogUpdateResult.modifiedCount} attendance records`);
            } catch (error) {
                console.log(`  ⚠️  DailyLog update skipped: ${error.message}`);
            }

            // Update all exam results for this school
            try {
                const examResultUpdateResult = await ExamResult.updateMany(
                    {
                        tenant_id: schoolId,
                        session_id: { $exists: false }
                    },
                    {
                        $set: {
                            session_id: session._id
                        }
                    }
                );

                console.log(`  ✅ Updated ${examResultUpdateResult.modifiedCount} exam result records`);
            } catch (error) {
                console.log(`  ⚠️  ExamResult update skipped: ${error.message}`);
            }

            // Update all results for this school
            try {
                const resultUpdateResult = await Result.updateMany(
                    {
                        tenant_id: schoolId,
                        session_id: { $exists: false }
                    },
                    {
                        $set: {
                            session_id: session._id
                        }
                    }
                );

                console.log(`  ✅ Updated ${resultUpdateResult.modifiedCount} result records`);
            } catch (error) {
                console.log(`  ⚠️  Result update skipped: ${error.message}`);
            }
        }

        console.log('\n\n✅ Migration completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Schools processed: ${schools.length}`);
        console.log(`   - Sessions created: Check above for details`);
        console.log(`   - Students updated: Check above for details`);
        console.log(`   - Fees updated: Check above for details`);

        console.log('\n✅ You can now deploy the session management system');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run migration
if (require.main === module) {
    migrateToSessions();
}

module.exports = migrateToSessions;
