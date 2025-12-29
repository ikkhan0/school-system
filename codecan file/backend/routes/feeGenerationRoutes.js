const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const Student = require('../models/Student');
const Fee = require('../models/Fee');

// Helper: Normalize month format (e.g. "Dec 2025" -> "Dec-2025")
const normalizeMonth = (m) => {
    if (!m) return m;
    return m.replace(/\s+/g, '-');
};

// Helper: Get variations to check existing records
const getMonthVariations = (m) => {
    if (!m) return [];
    const normalized = normalizeMonth(m);
    const spaced = m.replace(/-/g, ' ');
    return [...new Set([m, normalized, spaced])];
};

// @desc    Generate Fees for a Class/Month
// @route   POST /api/fees/generate
// @access  Private (fees.create permission)
router.post('/generate', protect, checkPermission('fees.create'), async (req, res) => {
    try {
        const { class_id, section_id, month, due_date } = req.body;

        if (!class_id || !month) {
            return res.status(400).json({ message: 'class_id and month are required' });
        }

        // Build student query
        const studentQuery = {
            is_active: true,
            tenant_id: req.tenant_id,
            class_id
        };

        if (section_id) {
            studentQuery.section_id = section_id;
        }

        // Add session filter if available
        if (req.session_id) {
            studentQuery.current_session_id = req.session_id;
        }

        const students = await Student.find(studentQuery);

        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found for the specified class/section' });
        }

        const results = {
            created: 0,
            skipped: 0,
            errors: []
        };

        for (const student of students) {
            try {
                // Check if fee already exists for this student/month
                const variations = getMonthVariations(month);
                const existingFee = await Fee.findOne({
                    student_id: student._id,
                    month: { $in: variations },
                    tenant_id: req.tenant_id
                });

                if (existingFee) {
                    results.skipped++;
                    continue;
                }

                // Calculate arrears (previous unpaid fees)
                const feeQuery = {
                    student_id: student._id,
                    tenant_id: req.tenant_id,
                    status: { $in: ['Pending', 'Partial'] },
                    balance: { $gt: 0 }
                };
                if (req.session_id) {
                    feeQuery.session_id = req.session_id;
                }

                const previousFees = await Fee.find(feeQuery);
                const arrears = previousFees.reduce((sum, f) => sum + (f.balance || 0), 0);

                // Get monthly fee from student record
                const monthlyFee = student.monthly_fee || 5000;

                // Calculate discount if applicable
                let policyDiscount = 0;
                let manualDiscount = 0;
                let totalDiscount = 0;

                // Check for auto-discounts (sibling, merit, etc.)
                // You can add discount logic here based on student.discount_policies

                const grossAmount = monthlyFee - totalDiscount;

                // Create new fee record
                const newFee = new Fee({
                    student_id: student._id,
                    tenant_id: req.tenant_id,
                    session_id: req.session_id,
                    month,
                    tuition_fee: monthlyFee,
                    concession: totalDiscount,
                    other_charges: 0,
                    arrears: arrears,
                    discount_applied: {
                        policy_discount: policyDiscount,
                        manual_discount: manualDiscount,
                        total_discount: totalDiscount
                    },
                    original_amount: monthlyFee,
                    gross_amount: grossAmount,
                    final_amount: grossAmount,
                    paid_amount: 0,
                    balance: grossAmount,
                    status: 'Pending',
                    due_date: due_date ? new Date(due_date) : undefined
                });

                await newFee.save();
                results.created++;

            } catch (error) {
                results.errors.push({
                    student_id: student._id,
                    student_name: student.full_name,
                    error: error.message
                });
            }
        }

        res.json({
            message: `Fee generation completed`,
            total_students: students.length,
            created: results.created,
            skipped: results.skipped,
            failed: results.errors.length,
            errors: results.errors.length > 0 ? results.errors : undefined
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auto-generate fees for all active students (Monthly Cron Job)
// @route   POST /api/fees/auto-generate
// @access  Private (Admin only)
router.post('/auto-generate', protect, checkPermission('fees.create'), async (req, res) => {
    try {
        const { month, due_date } = req.body;

        if (!month) {
            return res.status(400).json({ message: 'month is required (e.g., Jan-2025)' });
        }

        // Get all active students
        const studentQuery = {
            is_active: true,
            tenant_id: req.tenant_id
        };

        if (req.session_id) {
            studentQuery.current_session_id = req.session_id;
        }

        const students = await Student.find(studentQuery);

        const results = {
            created: 0,
            skipped: 0,
            errors: []
        };

        for (const student of students) {
            try {
                // Check if fee already exists
                const variations = getMonthVariations(month);
                const existingFee = await Fee.findOne({
                    student_id: student._id,
                    month: { $in: variations },
                    tenant_id: req.tenant_id
                });

                if (existingFee) {
                    results.skipped++;
                    continue;
                }

                // Calculate arrears
                const feeQuery = {
                    student_id: student._id,
                    tenant_id: req.tenant_id,
                    status: { $in: ['Pending', 'Partial'] },
                    balance: { $gt: 0 }
                };
                if (req.session_id) {
                    feeQuery.session_id = req.session_id;
                }

                const previousFees = await Fee.find(feeQuery);
                const arrears = previousFees.reduce((sum, f) => sum + (f.balance || 0), 0);

                const monthlyFee = student.monthly_fee || 5000;
                const grossAmount = monthlyFee;

                // Create fee
                const newFee = new Fee({
                    student_id: student._id,
                    tenant_id: req.tenant_id,
                    session_id: req.session_id,
                    month,
                    tuition_fee: monthlyFee,
                    arrears: arrears,
                    gross_amount: grossAmount,
                    paid_amount: 0,
                    balance: grossAmount,
                    status: 'Pending',
                    due_date: due_date ? new Date(due_date) : undefined
                });

                await newFee.save();
                results.created++;

            } catch (error) {
                results.errors.push({
                    student_id: student._id,
                    error: error.message
                });
            }
        }

        res.json({
            message: `Auto-generated fees for ${month}`,
            total_students: students.length,
            created: results.created,
            skipped: results.skipped,
            failed: results.errors.length
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
