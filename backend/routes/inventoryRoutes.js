const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const InventoryCategory = require('../models/InventoryCategory');
const InventorySupplier = require('../models/InventorySupplier');
const InventoryStore = require('../models/InventoryStore');
const InventoryTransaction = require('../models/InventoryTransaction');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission'); // Assuming you have this or similar

// Middleware to check if Inventory Module is enabled
const checkInventoryEnabled = (req, res, next) => {
    // Ideally check req.school.settings.modules.inventory
    // For now, assuming it's enabled or handled by frontend visibility
    next();
};

router.use(protect);
router.use(checkInventoryEnabled);

// --- ITEMS CRUD ---

// Get all items
router.get('/items', async (req, res) => {
    try {
        const items = await InventoryItem.find({ tenant_id: req.tenant_id })
            .populate('category_id', 'name');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create item
router.post('/items', async (req, res) => {
    try {
        const item = await InventoryItem.create({
            ...req.body,
            tenant_id: req.tenant_id
        });
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update item
router.put('/items/:id', async (req, res) => {
    try {
        const item = await InventoryItem.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenant_id },
            req.body,
            { new: true }
        );
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete item
router.delete('/items/:id', async (req, res) => {
    try {
        await InventoryItem.findOneAndDelete({ _id: req.params.id, tenant_id: req.tenant_id });
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- CATEGORIES CRUD ---
router.get('/categories', async (req, res) => {
    try {
        const categories = await InventoryCategory.find({ tenant_id: req.tenant_id });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const category = await InventoryCategory.create({ ...req.body, tenant_id: req.tenant_id });
        res.json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const category = await InventoryCategory.findOneAndUpdate({ _id: req.params.id, tenant_id: req.tenant_id }, req.body, { new: true });
        res.json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await InventoryCategory.findOneAndDelete({ _id: req.params.id, tenant_id: req.tenant_id });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- STORES CRUD ---
router.get('/stores', async (req, res) => {
    try {
        const stores = await InventoryStore.find({ tenant_id: req.tenant_id });
        res.json(stores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/stores', async (req, res) => {
    try {
        const store = await InventoryStore.create({ ...req.body, tenant_id: req.tenant_id });
        res.json(store);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- SUPPLIERS CRUD ---
router.get('/suppliers', async (req, res) => {
    try {
        const suppliers = await InventorySupplier.find({ tenant_id: req.tenant_id });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/suppliers', async (req, res) => {
    try {
        const supplier = await InventorySupplier.create({ ...req.body, tenant_id: req.tenant_id });
        res.json(supplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- TRANSACTIONS (PURCHASE / ISSUE / RETURN) ---

// Purchase (Stock In)
router.post('/purchase', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { item_id, quantity, unit_price, supplier_id, store_id, date, remarks } = req.body;
        const total_cost = quantity * unit_price;

        // 1. Create Transaction Record
        const transaction = await InventoryTransaction.create([{
            item_id,
            transaction_type: 'PURCHASE',
            quantity,
            unit_price,
            total_cost,
            supplier_id,
            store_id,
            date: date || new Date(),
            remarks,
            tenant_id: req.tenant_id
        }], { session });

        // 2. Update Item Stock & Price
        const item = await InventoryItem.findOne({ _id: item_id, tenant_id: req.tenant_id }).session(session);
        if (!item) throw new Error('Item not found');

        // Weighted Average Price Calculation (Optional, currently simple override or avg?)
        // Let's just update unit_price to latest purchase price for now as per plan
        item.current_stock += Number(quantity);
        item.unit_price = unit_price;
        await item.save({ session });

        await session.commitTransaction();
        res.status(201).json(transaction[0]);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

// Issue (Stock Out)
router.post('/issue', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { item_id, quantity, issued_to_user, issued_to_name, department, date, remarks } = req.body;

        const item = await InventoryItem.findOne({ _id: item_id, tenant_id: req.tenant_id }).session(session);
        if (!item) throw new Error('Item not found');

        if (item.current_stock < quantity) {
            throw new Error(`Insufficient stock. Available: ${item.current_stock}`);
        }

        // 1. Create Transaction (Issue)
        const transaction = await InventoryTransaction.create([{
            item_id,
            transaction_type: 'ISSUE',
            quantity,
            issued_to_user,
            issued_to_name,
            department,
            issued_by: req.user._id,
            status: 'ISSUED', // Relevant for Fixed Assets
            date: date || new Date(),
            remarks,
            tenant_id: req.tenant_id
        }], { session });

        // 2. Reduce Stock
        item.current_stock -= Number(quantity);
        await item.save({ session });

        await session.commitTransaction();
        res.status(201).json(transaction[0]);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

// Return (Fixed Asset Return)
router.post('/return', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { transaction_id, date, remarks } = req.body;

        // Find original issue transaction
        const issueTrx = await InventoryTransaction.findOne({ _id: transaction_id, tenant_id: req.tenant_id }).session(session);
        if (!issueTrx) throw new Error('Transaction not found');
        if (issueTrx.transaction_type !== 'ISSUE') throw new Error('Can only return Issued items');
        if (issueTrx.status === 'RETURNED') throw new Error('Item already returned');

        // 1. Create Return Transaction
        const returnTrx = await InventoryTransaction.create([{
            item_id: issueTrx.item_id,
            transaction_type: 'RETURN',
            quantity: issueTrx.quantity, // Returning full quantity for now
            issued_to_user: issueTrx.issued_to_user,
            issued_to_name: issueTrx.issued_to_name,
            date: date || new Date(),
            remarks,
            tenant_id: req.tenant_id
        }], { session });

        // 2. Update Original Transaction Status
        issueTrx.status = 'RETURNED';
        issueTrx.return_date = date || new Date();
        await issueTrx.save({ session });

        // 3. Increase Stock back
        const item = await InventoryItem.findOne({ _id: issueTrx.item_id, tenant_id: req.tenant_id }).session(session);
        item.current_stock += Number(issueTrx.quantity);
        await item.save({ session });

        await session.commitTransaction();
        res.json(returnTrx[0]);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

// Helper: Get Transactions (Report)
router.get('/transactions', async (req, res) => {
    try {
        const { start_date, end_date, type, item_id } = req.query;
        let query = { tenant_id: req.tenant_id };

        if (start_date && end_date) {
            query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };
        }
        if (type) query.transaction_type = type;
        if (item_id) query.item_id = item_id;

        const transactions = await InventoryTransaction.find(query)
            .populate('item_id', 'name category_id')
            .populate('supplier_id', 'name')
            .populate('store_id', 'name')
            .populate('issued_to_user', 'full_name') // Assuming Student/Staff user
            .populate('issued_by', 'name') // User
            .sort({ date: -1 });

        // Deep populate category if needed
        // await InventoryCategory.populate(transactions, { path: 'item_id.category_id' });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
