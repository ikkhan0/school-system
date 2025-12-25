// Simplified Migration Script - Production Ready
const mongoose = require('mongoose');
require('dotenv').config();

// Simple models - inline to avoid import issues
const AcademicSession = mongoose.model('AcademicSession', new mongoose.Schema({
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    session_name: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
    is_current: { type: Boolean, default: false },
    is_locked: { type: Boolean, default: false },
    locked_modules: {
        attendance: { type: Boolean, default: false },
        fees: { type: Boolean, default: false },
        marks: { type: Boolean, default: false },
        admissions: { type: Boolean, default: false }
    },
    notes: String
}, { timestamps: true }));

async function runMigration() {
    try {
        console.log('🚀 Starting simplified migration...\n');

        // Connect
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get distinct tenant_ids from students collection
        const tenantIds = await mongoose.connection.db.collection('students').distinct('tenant_id');
        console.log(`📊 Found ${tenantIds.length} schools\n`);

        for (const tenantId of tenantIds) {
            if (!tenantId) continue;

            console.log(`🏫 Processing school: ${tenantId}`);

            // Check if session exists
            const existing = await AcademicSession.findOne({
                tenant_id: tenantId,
                session_name: '2024-2025'
            });

            if (existing) {
                console.log(`  ℹ️  Session already exists\n`);
                continue;
            }

            // Create session
            const session = await AcademicSession.create({
                tenant_id: tenantId,
                session_name: '2024-2025',
                start_date: new Date('2024-04-01'),
                end_date: new Date('2025-03-31'),
                is_active: true,
                is_current: true,
                is_locked: false,
                notes: 'Auto-created by migration'
            });

            console.log(`  ✅ Created session: ${session.session_name}`);

            // Update students
            const studentsResult = await mongoose.connection.db.collection('students').updateMany(
                { tenant_id: tenantId, current_session_id: { $exists: false } },
                { $set: { current_session_id: session._id, session_history: [] } }
            );
            console.log(`  ✅ Updated ${studentsResult.modifiedCount} students`);

            // Update fees
            const feesResult = await mongoose.connection.db.collection('fees').updateMany(
                { tenant_id: tenantId, session_id: { $exists: false } },
                { $set: { session_id: session._id } }
            );
            console.log(`  ✅ Updated ${feesResult.modifiedCount} fees\n`);
        }

        console.log('✅ Migration completed successfully!\n');
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

runMigration();
