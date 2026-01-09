const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const AccountHead = require('../models/AccountHead');
const Voucher = require('../models/Voucher');
const VoucherDetail = require('../models/VoucherDetail');
const FiscalYear = require('../models/FiscalYear');

// Middleware to ensure Accounting is enabled
const checkAccountingModule = async (req, res, next) => {
    // Assuming req.school is populated by authMiddleware or we fetch it
    // For now, skipping check to speed up dev or implementing simple check
    next();
};

// ==========================================
// Chart of Accounts
// ==========================================

// Get All Account Heads
router.get('/accounts', protect, async (req, res) => {
    try {
        const accounts = await AccountHead.find({ tenant_id: req.tenant_id }).sort({ code: 1 });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Account Head
router.post('/accounts', protect, async (req, res) => {
    try {
        const { name, code, type, parent_id } = req.body;
        const account = new AccountHead({
            name, code, type, parent_id,
            tenant_id: req.tenant_id
        });
        await account.save();
        res.status(201).json(account);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Setup Default Accounts (Seeding)
router.post('/setup-defaults', protect, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const tenant_id = req.tenant_id;
        const existing = await AccountHead.findOne({ tenant_id });
        if (existing) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Accounts already exist for this tenant' });
        }

        const defaults = [
            // Assets
            { code: '1001', name: 'Cash in Hand', type: 'ASSET', is_system: true },
            { code: '1002', name: 'Cash at Bank', type: 'ASSET', is_system: true },
            { code: '1003', name: 'Accounts Receivable (Fees)', type: 'ASSET', is_system: true },
            { code: '1004', name: 'Inventory Assets', type: 'ASSET', is_system: true },
            // Liabilities
            { code: '2001', name: 'Accounts Payable', type: 'LIABILITY', is_system: true },
            // Equity
            { code: '3001', name: 'Capital', type: 'EQUITY', is_system: true },
            // Income
            { code: '4001', name: 'Tuition Fee Income', type: 'INCOME' },
            { code: '4002', name: 'Admission Fee Income', type: 'INCOME' },
            // Expenses
            { code: '5001', name: 'Salary Expense', type: 'EXPENSE' },
            { code: '5002', name: 'Rent Expense', type: 'EXPENSE' },
            { code: '5003', name: 'Utility Expense', type: 'EXPENSE' },
            { code: '5004', name: 'Purchase Expense', type: 'EXPENSE' },
        ];

        await AccountHead.insertMany(defaults.map(d => ({ ...d, tenant_id })), { session });
        await session.commitTransaction();
        res.json({ message: 'Default accounts created successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

// ==========================================
// Vouchers
// ==========================================

// Get Vouchers (Filtered)
router.get('/vouchers', protect, async (req, res) => {
    try {
        const { start_date, end_date, type } = req.query;
        let query = { tenant_id: req.tenant_id };

        if (start_date && end_date) {
            query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };
        }
        if (type) query.type = type;

        const vouchers = await Voucher.find(query).sort({ date: -1, voucher_no: -1 });
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Single Voucher with Details
router.get('/vouchers/:id', protect, async (req, res) => {
    try {
        const voucher = await Voucher.findOne({ _id: req.params.id, tenant_id: req.tenant_id });
        if (!voucher) return res.status(404).json({ message: 'Voucher not found' });

        const details = await VoucherDetail.find({ voucher_id: voucher._id }).populate('account_id');
        res.json({ voucher, details });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Voucher (Transaction)
router.post('/vouchers', protect, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { date, type, description, entries } = req.body; // entries = [{ account_id, debit, credit, description }]

        // Validate Balance
        const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Voucher is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
        }

        // Generate Voucher No
        const count = await Voucher.countDocuments({ tenant_id: req.tenant_id, type });
        const voucher_no = `${type}-${String(count + 1).padStart(4, '0')}`;

        const voucher = new Voucher({
            voucher_no,
            date: date || new Date(),
            type,
            description,
            tenant_id: req.tenant_id,
            created_by: req.user._id,
            status: 'POSTED' // Direct posting for now
        });
        await voucher.save({ session });

        const details = entries.map(entry => ({
            voucher_id: voucher._id,
            account_id: entry.account_id,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            description: entry.description || description,
            tenant_id: req.tenant_id
        }));

        await VoucherDetail.insertMany(details, { session });

        await session.commitTransaction();
        res.status(201).json(voucher);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

// ==========================================
// Reports
// ==========================================

// Trial Balance
router.get('/reports/trial-balance', protect, async (req, res) => {
    try {
        const heads = await AccountHead.find({ tenant_id: req.tenant_id }).lean();
        const report = [];

        for (const head of heads) {
            // Aggregate all debits and credits for this account
            const result = await VoucherDetail.aggregate([
                { $match: { account_id: head._id, tenant_id: req.tenant_id } }, // Add date filter here later
                { $group: { _id: null, totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' } } }
            ]);

            const debit = result[0]?.totalDebit || 0;
            const credit = result[0]?.totalCredit || 0;
            const balance = debit - credit;

            if (debit !== 0 || credit !== 0) {
                report.push({
                    code: head.code,
                    name: head.name,
                    type: head.type,
                    debit,
                    credit,
                    balance
                });
            }
        }
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// General Ledger
router.get('/reports/ledger', protect, async (req, res) => {
    try {
        const { account_id, start_date, end_date } = req.query;
        const tenant_id = req.tenant_id;

        if (!account_id || !start_date || !end_date) {
            return res.status(400).json({ message: 'Account, Start Date, and End Date are required' });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);

        // 1. Calculate Opening Balance (Sum of debit-credit before start_date)
        const openingBalanceResult = await VoucherDetail.aggregate([
            {
                $lookup: {
                    from: 'vouchers',
                    localField: 'voucher_id',
                    foreignField: '_id',
                    as: 'voucher'
                }
            },
            { $unwind: '$voucher' },
            {
                $match: {
                    'tenant_id': new mongoose.Types.ObjectId(tenant_id),
                    'account_id': new mongoose.Types.ObjectId(account_id),
                    'voucher.date': { $lt: start }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDebit: { $sum: '$debit' },
                    totalCredit: { $sum: '$credit' }
                }
            }
        ]);

        const opDebit = openingBalanceResult[0]?.totalDebit || 0;
        const opCredit = openingBalanceResult[0]?.totalCredit || 0;
        const openingBalance = opDebit - opCredit; // Positive = Debit Balance

        // 2. Fetch Transactions in Date Range
        const transactions = await VoucherDetail.aggregate([
            {
                $lookup: {
                    from: 'vouchers',
                    localField: 'voucher_id',
                    foreignField: '_id',
                    as: 'voucher'
                }
            },
            { $unwind: '$voucher' },
            {
                $match: {
                    'tenant_id': new mongoose.Types.ObjectId(tenant_id),
                    'account_id': new mongoose.Types.ObjectId(account_id),
                    'voucher.date': { $gte: start, $lte: end }
                }
            },
            { $sort: { 'voucher.date': 1, 'voucher.createdAt': 1 } }
        ]);

        res.json({
            opening_balance: openingBalance,
            transactions: transactions.map(t => ({
                date: t.voucher.date,
                voucher_no: t.voucher.voucher_no,
                description: t.description || t.voucher.description,
                type: t.voucher.type,
                debit: t.debit,
                credit: t.credit
            }))
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
