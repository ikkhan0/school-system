const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Family = require('../models/Family');

const { protect } = require('../middleware/auth');

// @desc    Get Family Fee Details by searching for ONE student
// @route   GET /api/fees/family-view?search=roll_or_name
router.get('/family-view', protect, async (req, res) => {
    try {
        const { search } = req.query;
        if (!search) return res.status(400).json({ message: "Search term required" });

        // 1. Find the student (Scoped to School)
        const student = await Student.findOne({
            school_id: req.user.school_id,
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
            siblings = await Student.find({ family_id: student.family_id, school_id: req.user.school_id });
        } else {
            siblings = [student];
        }

        const currentMonth = req.query.month || "Dec-2025"; // In real app, dynamic

        const familyData = await Promise.all(siblings.map(async (sib) => {
            let fee = await Fee.findOne({ student_id: sib._id, month: currentMonth, school_id: req.user.school_id });

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
router.post('/collect', protect, async (req, res) => {
    try {
        const { payments } = req.body;
        const results = [];

        for (const p of payments) {
            let fee = await Fee.findOne({ student_id: p.student_id, month: p.month, school_id: req.user.school_id });

            if (!fee) {
                fee = new Fee({
                    student_id: p.student_id,
                    school_id: req.user.school_id,
                    month: p.month,
                    tuition_fee: p.total_due,
                    gross_amount: p.total_due,
                    paid_amount: 0,
                    balance: p.total_due,
                    status: 'Pending'
                });
            }

            const newPaid = fee.paid_amount + Number(p.amount_paying);
            const newBalance = fee.gross_amount - newPaid;

            fee.paid_amount = newPaid;
            fee.balance = newBalance;
            fee.status = newBalance <= 0 ? 'Paid' : 'Partial';
            fee.payment_date = new Date();

            await fee.save();
            results.push(fee);
        }

        res.json({ message: "Fees Collected Successfully", data: results });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// @desc    Add a Fee Manually for a Student
// @route   POST /api/fees/add
router.post('/add', protect, async (req, res) => {
    try {
        const { student_id, month, amount, description } = req.body;

        const newFee = new Fee({
            student_id,
            school_id: req.user.school_id,
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
router.get('/bulk-slips', protect, async (req, res) => {
    try {
        const { class_id, section_id, month } = req.query;
        // Search loose to allow just class
        const query = { is_active: true, school_id: req.user.school_id };
        if (class_id) query.class_id = class_id;
        if (section_id) query.section_id = section_id;

        const students = await Student.find(query).populate('family_id');

        const slips = await Promise.all(students.map(async (student) => {
            let fee = await Fee.findOne({ student_id: student._id, month });
            if (!fee) {
                // Mock Preview
                fee = {
                    month,
                    tuition_fee: student.monthly_fee || 5000,
                    arrears: 0,
                    gross_amount: student.monthly_fee || 5000,
                    balance: student.monthly_fee || 5000
                };
            }
            return {
                student: student,
                father_name: student.family_id?.father_name || student.father_name || 'N/A',
                fee: fee
            };
        }));

        res.json(slips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Student Fee Ledger (History)
// @route   GET /api/fees/ledger/:student_id
router.get('/ledger/:student_id', protect, async (req, res) => {
    try {
        const fees = await Fee.find({
            student_id: req.params.student_id,
            school_id: req.user.school_id
        }).sort({ createdAt: -1 }); // Latest first

        // Calculate running balance or totals if needed
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
