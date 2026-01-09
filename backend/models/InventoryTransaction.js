const mongoose = require('mongoose');

const inventoryTransactionSchema = mongoose.Schema({
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    transaction_type: {
        type: String,
        enum: ['PURCHASE', 'ISSUE', 'RETURN'],
        required: true
    },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

    // Purchase Fields
    supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventorySupplier' },
    store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryStore' },
    unit_price: { type: Number },
    total_cost: { type: Number },

    // Issue/Return Fields
    issued_to_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Staff or Student User ID
    issued_to_name: { type: String }, // Manual name entry for quick issue
    issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: String },

    // Fixed Asset Tracking
    status: {
        type: String,
        enum: ['ISSUED', 'RETURNED', 'CONSUMED'],
        default: 'CONSUMED'
    },
    return_date: { type: Date },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
