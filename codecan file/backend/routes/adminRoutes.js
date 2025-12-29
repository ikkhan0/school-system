const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/protectAdmin');
const Student = require('../models/Student');
const AcademicSession = require('../models/AcademicSession');

/**
 * @desc    Fix imported students missing session IDs (One-time migration)
 * @route   POST /api/admin/fix-imported-students
 * @access  Private (Super Admin only)
 */
router.post('/fix-imported-students', protectAdmin, async (req, res) => {
    try {

        const results = {
            schoolsProcessed: 0,
            studentsUpdated: 0,
            errors: []
        };

        // Get all unique tenant IDs with students missing session IDs
        const tenants = await Student.distinct('tenant_id', {
            current_session_id: null,
            is_active: true
        });

        console.log(`Found ${tenants.length} schools with students missing session IDs`);

        for (const tenant_id of tenants) {
            try {
                // Find the active session for this school
                const activeSession = await AcademicSession.findOne({
                    tenant_id,
                    is_active: true
                });

                if (!activeSession) {
                    results.errors.push({
                        tenant_id: tenant_id.toString(),
                        error: 'No active session found'
                    });
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

                results.schoolsProcessed++;
                results.studentsUpdated += result.modifiedCount;

                console.log(`✅ Updated ${result.modifiedCount} students for tenant ${tenant_id} (Session: ${activeSession.name})`);

            } catch (error) {
                console.error(`Error processing tenant ${tenant_id}:`, error);
                results.errors.push({
                    tenant_id: tenant_id.toString(),
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Migration completed',
            results
        });

    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
});

module.exports = router;
