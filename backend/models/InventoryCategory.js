const mongoose = require('mongoose');

const inventoryCategorySchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryCategory', inventoryCategorySchema);
