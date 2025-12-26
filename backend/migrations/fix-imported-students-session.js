const mongoose = require('mongoose');
const Student = require('../models/Student');
const Session = require('../models/Session');

/**
 * Migration Script: Fix Imported Students Missing Session IDs
 * 
 * This script assigns the active session to all students that don't have a current_session_id.
 * This fixes students that were imported via CSV before the session_id fix was applied.
 * 
 * Run this ONCE after deploying the fix to studentRoutes.js
 */

async function migrateImportedStudents() {
    try {
        // Get all unique tenant IDs
        const tenants = await Student.distinct('tenant_id', { current_session_id: null, is_active: true });

        console.log(`Found ${tenants.length} schools with students missing session IDs`);

        let totalUpdated = 0;

        for (const tenant_id of tenants) {
            // Find the active session for this school
            const activeSession = await Session.findOne({
                tenant_id,
                is_active: true
            });

            if (!activeSession) {
                console.warn(`⚠️  No active session found for tenant ${tenant_id}, skipping...`);
                continue;
            }

            // Update all students without a session_id
            const result = await Student.updateMany(
                {
                    tenant_id,
                    current_session_id: null,
                    is_active: true
                },
                {
                    current_session_id: activeSession._id
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} students for tenant ${tenant_id} (Session: ${activeSession.name})`);
            totalUpdated += result.modifiedCount;
        }

        console.log(`\n🎉 Migration complete! Total students updated: ${totalUpdated}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Export for use as a script or in routes
module.exports = { migrateImportedStudents };

// If run directly
if (require.main === module) {
    const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_system';

    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('📊 Connected to MongoDB');
            return migrateImportedStudents();
        })
        .then(() => {
            console.log('✅ Migration successful');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}
