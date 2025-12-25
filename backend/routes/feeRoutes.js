const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Family = require('../models/Family');

const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Get Family Fee Details by searching for ONE student
// @route   GET /api/fees/family-view?search=roll_or_name
router.get('/family-view', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const { search } = req.query;
        if (!search) return res.status(400).json({ message: "Search term required" });

        // 1. Find the student (Scoped to School)
        const student = await Student.findOne({
            tenant_id: req.tenant_id,
            is_active: true,
            $or: [
                { roll_no: search },
                { full_name: { $regex: search, $options: 'i' } }
            ]
        });

        if (!student) return res.status(404).json({ message: "Student not found" });

        // 2. Find ALL siblings (Scoped to School, implicit via family check usually but explicit here)
        let siblings = [];
        let family = null;

        if (student.family_id) {
            family = await Family.findById(student.family_id);
            siblings = await Student.find({ family_id: student.family_id, tenant_id: req.tenant_id, is_active: true });
        } else {
            siblings = [student];
        }

        const currentMonth = req.query.month || "Dec-2025"; // In real app, dynamic

        const familyData = await Promise.all(siblings.map(async (sib) => {
            let fee = await Fee.findOne({ student_id: sib._id, month: currentMonth, tenant_id: req.tenant_id });

            if (!fee) {
                // Mocking with new structure
                fee = {
                    _id: "preview_" + sib._id,
                    month: currentMonth,
                    tuition_fee: 5000,
                    concession: 0,
                    other_charges: 0,
                    arrears: 1000,
                    gross_amount: 6000,
                    paid_amount: 0,
                    balance: 6000,
                    status: 'Pending'
                };
            }

            return {
                student: sib,
                fee: fee
            };
        }));

        res.json({
            family: family || { father_name: student.father_name, father_mobile: "N/A" },
            students: familyData
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Collect Fee (Bulk or Single)
// @route   POST /api/fees/collect
router.post('/collect', protect, checkPermission('fees.collect'), async (req, res) => {
    try {
        const { payments } = req.body;
        const results = [];
        const errors = [];

        for (const p of payments) {
            try {
                // Find fee with session_id to prevent cross-session issues
                const query = {
                    student_id: p.student_id,
                    month: p.month,
                    tenant_id: req.tenant_id
                };

                // Add session filter if available
                if (req.session_id) {
                    query.session_id = req.session_id;
                }

                let fee = await Fee.findOne(query);

                if (!fee) {
                    // Create new fee record
                    fee = new Fee({
                        student_id: p.student_id,
                        tenant_id: req.tenant_id,
                        session_id: req.session_id,
                        month: p.month,
                        tuition_fee: p.total_due || 0,
                        gross_amount: p.total_due || 0,
                        paid_amount: 0,
                        balance: p.total_due || 0,
                        status: 'Pending'
                    });
                }


                // Check if already fully paid
                if (fee.status === 'Paid' && fee.balance <= 0 && (!fee.arrears || fee.arrears <= 0)) {
                    errors.push({
                        student_id: p.student_id,
                        month: p.month,
                        error: 'Fee already paid for this month'
                    });
                    continue;
                }

                // Calculate total due (current month + arrears)
                const currentArrears = fee.arrears || 0;
                const currentMonthDue = fee.balance || 0;
                const totalDue = currentMonthDue + currentArrears;

                // Calculate new amounts
                const amountPaying = Number(p.amount_paying) || 0;

                // Prevent overpayment
                if (amountPaying > totalDue) {
                    errors.push({
                        student_id: p.student_id,
                        month: p.month,
                        error: `Overpayment: Trying to pay ${amountPaying} but only ${totalDue} is due (Fee: ${currentMonthDue}, Arrears: ${currentArrears})`
                    });
                    continue;
                }

                // Payment logic: First pay arrears, then current month
                let remainingPayment = amountPaying;
                let newArrears = currentArrears;
                let newPaid = fee.paid_amount;

                // Pay arrears first
                if (currentArrears > 0 && remainingPayment > 0) {
                    const arrearsPayment = Math.min(remainingPayment, currentArrears);
                    newArrears -= arrearsPayment;
                    remainingPayment -= arrearsPayment;
                }

                // Then pay current month
                if (remainingPayment > 0) {
                    newPaid += remainingPayment;
                }

                const newBalance = fee.gross_amount - newPaid;

                fee.paid_amount = newPaid;
                fee.balance = newBalance;
                fee.arrears = newArrears;
                fee.status = (newBalance <= 0 && newArrears <= 0) ? 'Paid' : (newPaid > 0 || newArrears < currentArrears ? 'Partial' : 'Pending');
                fee.payment_date = new Date();

                await fee.save();
                results.push(fee);
            } catch (error) {
                errors.push({
                    student_id: p.student_id,
                    month: p.month,
                    error: error.message
                });
            }
        }

        res.json({
            message: "Fee collection completed",
            success: results.length,
            failed: errors.length,
            data: results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// @desc    Add a Fee Manually for a Student
// @route   POST /api/fees/add
router.post('/add', protect, checkPermission('fees.create'), async (req, res) => {
    try {
        const { student_id, month, amount, description } = req.body;

        const newFee = new Fee({
            student_id,
            tenant_id: req.tenant_id,
            month,
            tuition_fee: amount,
            gross_amount: amount,
            running_balance: amount, // Assuming simple model
            balance: amount,
            description,
            status: 'Pending'
        });

        await newFee.save();
        res.status(201).json(newFee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Bulk Fee Slips for a Class
// @route   GET /api/fees/bulk-slips?class_id=X&section_id=Y&month=Jan-2025
router.get('/bulk-slips', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const { class_id, section_id, month } = req.query;

        // Build student query
        const query = { is_active: true, tenant_id: req.tenant_id };
        if (class_id) query.class_id = class_id;
        if (section_id) query.section_id = section_id;

        // Add session filter if available
        if (req.session_id) {
            query.current_session_id = req.session_id;
        }

        const students = await Student.find(query).populate('family_id');

        const slips = await Promise.all(students.map(async (student) => {
            // Get current month fee
            let currentFee = await Fee.findOne({
                student_id: student._id,
                month,
                tenant_id: req.tenant_id
            });

            // Calculate arrears (all previous unpaid fees in this session)
            const feeQuery = {
                student_id: student._id,
                tenant_id: req.tenant_id,
                status: { $in: ['Pending', 'Partial'] },
                month: { $ne: month }, // Exclude current month
                balance: { $gt: 0 }
            };
            if (req.session_id) {
                feeQuery.session_id = req.session_id;
            }

            const previousFees = await Fee.find(feeQuery);
            const arrears = previousFees.reduce((sum, f) => sum + (f.balance || 0), 0);

            if (!currentFee) {
                // Create preview/mock fee for current month
                const monthlyFee = student.monthly_fee || 5000;
                currentFee = {
                    month,
                    tuition_fee: monthlyFee,
                    concession: 0,
                    other_charges: 0,
                    arrears: arrears,
                    gross_amount: monthlyFee,
                    paid_amount: 0,
                    balance: monthlyFee,
                    status: 'Pending',
                    _isPreview: true // Flag to indicate this is not saved yet
                };
            } else {
                // Update arrears in existing fee if needed
                if (currentFee.arrears !== arrears) {
                    currentFee.arrears = arrears;
                }
            }

            // Calculate total payable = current month balance + arrears
            const totalPayable = (currentFee.balance || 0) + arrears;

            return {
                student: student,
                father_name: student.family_id?.father_name || student.father_name || 'N/A',
                fee: {
                    ...currentFee,
                    arrears: Math.round(arrears),
                    total_payable: Math.round(totalPayable),
                    fee_due: currentFee.balance || currentFee.gross_amount || 0
                }
            };
        }));

        res.json(slips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Fee Ledger (History)
// @route   GET /api/fees/ledger/:student_id
router.get('/ledger/:student_id', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const fees = await Fee.find({
            student_id: req.params.student_id,
            tenant_id: req.tenant_id
        }).sort({ createdAt: -1 }); // Latest first

        // Calculate running balance or totals if needed
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Fee Voucher for Printing
// @route   GET /api/fees/voucher/:student_id/:month
router.get('/voucher/:student_id/:month', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const { student_id, month } = req.params;

        const student = await Student.findOne({ _id: student_id, is_active: true }).populate('family_id');
        if (!student) {
            return res.status(404).json({ message: 'Student not found or inactive' });
        }

        let fee = await Fee.findOne({
            student_id,
            month,
            tenant_id: req.tenant_id
        });

        if (!fee) {
            return res.status(404).json({ message: 'Fee voucher not found' });
        }

        const School = require('../models/School');
        const school = await School.findById(req.tenant_id);

        res.json({
            student,
            fee,
            school
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update fee discount
// @route   PUT /api/fees/:id/discount
router.put('/:id/discount', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const { manual_discount, discount_reason } = req.body;

        const fee = await Fee.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!fee) {
            return res.status(404).json({ message: 'Fee not found' });
        }

        // Update discount
        if (!fee.discount_applied) {
            fee.discount_applied = {};
        }

        fee.discount_applied.manual_discount = parseFloat(manual_discount) || 0;
        fee.discount_applied.discount_reason = discount_reason || '';
        fee.discount_applied.total_discount = (fee.discount_applied.policy_discount || 0) + (parseFloat(manual_discount) || 0);
        fee.discount_applied.applied_by = req.user._id;
        fee.discount_applied.applied_at = new Date();

        // Recalculate final amount
        const originalAmount = fee.original_amount || fee.gross_amount;
        fee.final_amount = originalAmount - fee.discount_applied.total_discount;
        fee.balance = fee.final_amount - fee.paid_amount;

        await fee.save();

        res.json({ message: 'Discount updated successfully', fee });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
