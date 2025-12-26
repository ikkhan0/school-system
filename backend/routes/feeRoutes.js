const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Family = require('../models/Family');

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
                const variations = getMonthVariations(p.month);
                const query = {
                    student_id: p.student_id,
                    month: { $in: variations },
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
                        month: normalizeMonth(p.month), // Force standard format
                        tuition_fee: p.total_due || 0,
                        gross_amount: p.total_due || 0,
                        paid_amount: 0,
                        balance: p.total_due || 0,
                        status: 'Pending'
                    });
                }


                // Check if already fully paid
                if (fee.status === 'Paid' && fee.balance <= 0) {
                    errors.push({
                        student_id: p.student_id,
                        month: p.month,
                        error: 'Fee already paid for this month'
                    });
                    continue;
                }

                // Get all unpaid previous fees (arrears) - OLDEST FIRST
                const previousFeesQuery = {
                    student_id: p.student_id,
                    tenant_id: req.tenant_id,
                    status: { $in: ['Pending', 'Partial'] },
                    month: { $nin: variations }, // Exclude current month variations
                    balance: { $gt: 0 }
                };
                if (req.session_id) {
                    previousFeesQuery.session_id = req.session_id;
                }

                const previousFees = await Fee.find(previousFeesQuery).sort({ createdAt: 1 }); // Oldest first
                const totalArrears = previousFees.reduce((sum, f) => sum + (f.balance || 0), 0);

                // Calculate total due
                const currentMonthDue = fee.balance || 0;
                const totalDue = currentMonthDue + totalArrears;

                // Calculate new amounts
                const amountPaying = Number(p.amount_paying) || 0;

                // Prevent overpayment
                if (amountPaying > totalDue) {
                    errors.push({
                        student_id: p.student_id,
                        month: p.month,
                        error: `Overpayment: Trying to pay ${amountPaying} but only ${totalDue} is due (Current: ${currentMonthDue}, Arrears: ${totalArrears})`
                    });
                    continue;
                }

                // Payment logic: First pay OLD fees (arrears), then current month
                let remainingPayment = amountPaying;

                // Pay previous fees first (oldest to newest)
                for (const oldFee of previousFees) {
                    if (remainingPayment <= 0) break;

                    const oldBalance = oldFee.balance || 0;
                    const paymentForThis = Math.min(remainingPayment, oldBalance);

                    oldFee.paid_amount += paymentForThis;
                    oldFee.balance -= paymentForThis;
                    oldFee.status = oldFee.balance <= 0 ? 'Paid' : 'Partial';
                    oldFee.status = oldFee.balance <= 0 ? 'Paid' : 'Partial';
                    oldFee.payment_date = p.payment_date ? new Date(p.payment_date) : new Date();

                    await oldFee.save();
                    remainingPayment -= paymentForThis;
                }

                // Then pay current month with whatever is left
                if (remainingPayment > 0) {
                    fee.paid_amount += remainingPayment;
                    fee.balance = fee.gross_amount - fee.paid_amount;
                }

                fee.status = fee.balance <= 0 ? 'Paid' : (fee.paid_amount > 0 ? 'Partial' : 'Pending');
                fee.status = fee.balance <= 0 ? 'Paid' : (fee.paid_amount > 0 ? 'Partial' : 'Pending');
                fee.payment_date = p.payment_date ? new Date(p.payment_date) : new Date();

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



// @desc    Get Student Fee Ledger
// @route   GET /api/fees/ledger/:student_id
router.get('/ledger/:student_id', protect, checkPermission('fees.view'), async (req, res) => {
    try {
        const fees = await Fee.find({
            student_id: req.params.student_id,
            tenant_id: req.tenant_id
        }).sort({ payment_date: -1, month: -1, _id: -1 });

        // Deduplicate: If matching months exist, prefer Paid > Partial > Pending
        const grouped = {};
        fees.forEach(f => {
            const norm = normalizeMonth(f.month);
            if (!grouped[norm]) {
                grouped[norm] = f;
            } else {
                // Determine if we should replace the existing one
                const current = grouped[norm];
                const priority = { 'Paid': 3, 'Partial': 2, 'Pending': 1 };
                if ((priority[f.status] || 0) > (priority[current.status] || 0)) {
                    grouped[norm] = f;
                }
            }
        });

        const uniqueFees = Object.values(grouped).sort((a, b) => {
            // Sort by month (roughly) or date
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(uniqueFees);
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
            // Get current month fee (check variations)
            const variations = getMonthVariations(month);
            let currentFee = await Fee.findOne({
                student_id: student._id,
                month: { $in: variations },
                tenant_id: req.tenant_id
            });

            // Calculate arrears (all previous unpaid fees in this session)
            const feeQuery = {
                student_id: student._id,
                tenant_id: req.tenant_id,
                status: { $in: ['Pending', 'Partial'] },
                month: { $nin: variations }, // Exclude current month
                balance: { $gt: 0 }
            };
            if (req.session_id) {
                feeQuery.session_id = req.session_id;
            }

            const previousFees = await Fee.find(feeQuery);
            let arrears = 0;
            const outstanding_funds = [];
            for (const f of previousFees) {
                if (f.fee_type === 'Fund') {
                    outstanding_funds.push({ title: f.title, amount: f.balance });
                } else {
                    arrears += (f.balance || 0);
                }
            }

            if (!currentFee) {
                // Create preview/mock fee for current month
                const monthlyFee = student.monthly_fee || 5000;
                currentFee = {
                    month,
                    title: 'Monthly Fee',
                    fee_type: 'Tuition',
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

            // Calculate total payable = current month balance + arrears + funds
            const fundsTotal = outstanding_funds.reduce((s, f) => s + f.amount, 0);
            const feeBalance = currentFee.balance !== undefined ? currentFee.balance : currentFee.gross_amount;
            const totalPayable = (feeBalance || 0) + arrears + fundsTotal;

            return {
                student: student,
                father_name: student.family_id?.father_name || student.father_name || 'N/A',
                fee: {
                    ...currentFee,
                    arrears: Math.round(arrears),
                    outstanding_funds,
                    total_payable: Math.round(totalPayable),
                    fee_due: feeBalance || 0,
                    title: currentFee.title || 'Monthly Fee',
                    fee_type: currentFee.fee_type || 'Tuition',
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

        // Calculate Arrears and Funds
        const previousFees = await Fee.find({
            student_id,
            tenant_id: req.tenant_id,
            status: { $in: ['Pending', 'Partial'] },
            _id: { $ne: fee._id },
            balance: { $gt: 0 }
        });

        let arrears = 0;
        const outstanding_funds = [];
        for (const p of previousFees) {
            if (p.fee_type === 'Fund') outstanding_funds.push({ title: p.title, amount: p.balance });
            else arrears += (p.balance || 0);
        }

        const fObj = fee.toObject();
        fObj.arrears = arrears;
        fObj.outstanding_funds = outstanding_funds;
        fObj.total_payable = (fObj.balance || 0) + arrears + outstanding_funds.reduce((s, x) => s + x.amount, 0);

        res.json({
            student,
            fee: fObj,
            school
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Bulk Update Fee Details (e.g. Due Date)
// @route   PUT /api/fees/bulk-update
router.put('/bulk-update-batch', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const { class_id, section_id, month, due_date } = req.body;

        if (!month || !due_date) return res.status(400).json({ message: "Month and Due Date required" });

        const variations = getMonthVariations(month);

        // Find fees to update
        // We need to join with Student to filter by class/section, or use populate
        // But Fee doesn't store class directly usually, only student_id ref.
        // Wait, Fee doesn't have class_id. We need to find students first.

        let studentIds = [];
        if (class_id) {
            const query = { isActive: true, tenant_id: req.tenant_id, class_id };
            if (section_id) query.section_id = section_id;
            const students = await Student.find(query).select('_id');
            studentIds = students.map(s => s._id);
        }

        const feeQuery = {
            tenant_id: req.tenant_id,
            month: { $in: variations }
        };

        if (studentIds.length > 0) {
            feeQuery.student_id = { $in: studentIds };
        }

        const result = await Fee.updateMany(feeQuery, { $set: { due_date: new Date(due_date) } });

        res.json({ message: `Updated ${result.modifiedCount} fees with new due date.` });
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

// @desc    Update Fee Details (Amount, Status, Payment Date)
// @route   PUT /api/fees/:id
router.put('/:id', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const { paid_amount, status, payment_date, due_date, tuition_fee, other_charges, concession } = req.body;

        const fee = await Fee.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        // Update fields if provided
        if (paid_amount !== undefined) fee.paid_amount = Number(paid_amount);
        if (status) fee.status = status;
        if (payment_date) fee.payment_date = new Date(payment_date);
        if (due_date) fee.due_date = new Date(due_date);

        // Allow updating fee structure too if needed
        if (tuition_fee !== undefined) fee.tuition_fee = Number(tuition_fee);
        if (other_charges !== undefined) fee.other_charges = Number(other_charges);
        if (concession !== undefined) fee.concession = Number(concession);

        // Recalculate totals
        // Balance = (Tuition + Other - Concession - Discount) - Paid
        const gross = (fee.tuition_fee || 0) + (fee.other_charges || 0) - (fee.concession || 0);
        fee.gross_amount = gross;

        let final = gross;
        if (fee.discount_applied && fee.discount_applied.total_discount) {
            final -= fee.discount_applied.total_discount;
        }
        fee.final_amount = final;

        fee.balance = fee.final_amount - (fee.paid_amount || 0);

        // Auto-update status if not explicitly set
        if (!status) {
            if (fee.balance <= 0) fee.status = 'Paid';
            else if (fee.paid_amount > 0) fee.status = 'Partial';
            else fee.status = 'Pending';
        }

        await fee.save();
        res.json({ message: 'Fee record updated successfully', fee });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete Fee Record
// @route   DELETE /api/fees/:id
router.delete('/:id', protect, checkPermission('fees.delete'), async (req, res) => {
    try {
        const fee = await Fee.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        await fee.deleteOne();
        res.json({ message: 'Fee record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Bulk Update Fee Details (e.g. Due Date)
// @route   PUT /api/fees/bulk-update
router.put('/bulk-update-batch', protect, checkPermission('fees.edit'), async (req, res) => {
    try {
        const { class_id, section_id, month, due_date } = req.body;

        if (!month || !due_date) return res.status(400).json({ message: "Month and Due Date required" });

        const variations = getMonthVariations(month);

        // Find fees to update
        // We need to join with Student to filter by class/section, or use populate
        // But Fee doesn't store class directly usually, only student_id ref.
        // Wait, Fee doesn't have class_id. We need to find students first.

        let studentIds = [];
        if (class_id) {
            const query = { isActive: true, tenant_id: req.tenant_id, class_id };
            if (section_id) query.section_id = section_id;
            const students = await Student.find(query).select('_id');
            studentIds = students.map(s => s._id);
        }

        const feeQuery = {
            tenant_id: req.tenant_id,
            month: { $in: variations }
        };

        if (studentIds.length > 0) {
            feeQuery.student_id = { $in: studentIds };
        }

        const result = await Fee.updateMany(feeQuery, { $set: { due_date: new Date(due_date) } });

        res.json({ message: `Updated ${result.modifiedCount} fees with new due date.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
