const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ExpenseHead = require('../models/ExpenseHead');
const Expense = require('../models/Expense');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/expenses/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});

// ==================== EXPENSE HEADS ====================

// @desc    Create Expense Head
// @route   POST /api/expenses/heads
router.post('/heads', protect, async (req, res) => {
    try {
        const { name, description } = req.body;

        const expenseHead = await ExpenseHead.create({
            name,
            description,
            tenant_id: req.tenant_id,
            school_id: req.school_id
        });

        res.status(201).json(expenseHead);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'An expense head with this name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get All Expense Heads
// @route   GET /api/expenses/heads
router.get('/heads', protect, async (req, res) => {
    try {
        const expenseHeads = await ExpenseHead.find({
            tenant_id: req.tenant_id,
            is_active: true
        }).sort({ name: 1 });

        res.json(expenseHeads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Expense Head
// @route   PUT /api/expenses/heads/:id
router.put('/heads/:id', protect, async (req, res) => {
    try {
        const { name, description } = req.body;

        const expenseHead = await ExpenseHead.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenant_id },
            { name, description },
            { new: true, runValidators: true }
        );

        if (!expenseHead) {
            return res.status(404).json({ message: 'Expense head not found' });
        }

        res.json(expenseHead);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'An expense head with this name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete Expense Head
// @route   DELETE /api/expenses/heads/:id
router.delete('/heads/:id', protect, async (req, res) => {
    try {
        // Check if any expenses use this head
        const expenseCount = await Expense.countDocuments({
            expense_head_id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (expenseCount > 0) {
            return res.status(400).json({
                message: `Cannot delete expense head. ${expenseCount} expense(s) are using this category.`
            });
        }

        const expenseHead = await ExpenseHead.findOneAndDelete({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!expenseHead) {
            return res.status(404).json({ message: 'Expense head not found' });
        }

        res.json({ message: 'Expense head deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== EXPENSES ====================

// @desc    Create Expense
// @route   POST /api/expenses
router.post('/', protect, upload.single('attachment'), async (req, res) => {
    try {
        const { expense_head_id, name, description, invoice_number, date, amount } = req.body;

        const expenseData = {
            expense_head_id,
            name,
            description,
            invoice_number,
            date: date || new Date(),
            amount: parseFloat(amount),
            tenant_id: req.tenant_id,
            school_id: req.school_id
        };

        if (req.file) {
            expenseData.attachment = '/uploads/expenses/' + req.file.filename;
        }

        const expense = await Expense.create(expenseData);
        const populatedExpense = await Expense.findById(expense._id).populate('expense_head_id');

        res.status(201).json(populatedExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get All Expenses
// @route   GET /api/expenses
router.get('/', protect, async (req, res) => {
    try {
        const { start_date, end_date, expense_head_id } = req.query;

        let query = { tenant_id: req.tenant_id };

        if (start_date && end_date) {
            query.date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        if (expense_head_id) {
            query.expense_head_id = expense_head_id;
        }

        const expenses = await Expense.find(query)
            .populate('expense_head_id')
            .sort({ date: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Expense
// @route   PUT /api/expenses/:id
router.put('/:id', protect, upload.single('attachment'), async (req, res) => {
    try {
        const { expense_head_id, name, description, invoice_number, date, amount } = req.body;

        const updateData = {
            expense_head_id,
            name,
            description,
            invoice_number,
            date,
            amount: parseFloat(amount)
        };

        if (req.file) {
            updateData.attachment = '/uploads/expenses/' + req.file.filename;
        }

        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenant_id },
            updateData,
            { new: true, runValidators: true }
        ).populate('expense_head_id');

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete Expense
// @route   DELETE /api/expenses/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Expense Summary
// @route   GET /api/expenses/summary
router.get('/summary/stats', protect, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = {};
        if (start_date && end_date) {
            dateFilter = {
                date: {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date)
                }
            };
        }

        const summary = await Expense.aggregate([
            {
                $match: {
                    tenant_id: req.tenant_id,
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$expense_head_id',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'expenseheads',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'head'
                }
            },
            {
                $unwind: '$head'
            },
            {
                $project: {
                    expense_head: '$head.name',
                    total: 1,
                    count: 1
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        const totalExpenses = summary.reduce((sum, item) => sum + item.total, 0);

        res.json({
            summary,
            total_expenses: totalExpenses,
            total_transactions: summary.reduce((sum, item) => sum + item.count, 0)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
