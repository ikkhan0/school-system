const mongoose = require('mongoose');

const inventoryStoreSchema = mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String },
    description: { type: String },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryStore', inventoryStoreSchema);
