const mongoose = require('mongoose');

const inventoryItemSchema = mongoose.Schema({
    name: { type: String, required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryCategory', required: true },
    description: { type: String },
    unit: { type: String, required: true }, // e.g., 'pcs', 'kg', 'box'
    item_type: {
        type: String,
        enum: ['CONSUMABLE', 'FIXED_ASSET'],
        default: 'CONSUMABLE'
    },
    current_stock: { type: Number, default: 0 },
    unit_price: { type: Number, default: 0 },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
