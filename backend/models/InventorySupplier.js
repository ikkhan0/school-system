const mongoose = require('mongoose');

const inventorySupplierSchema = mongoose.Schema({
    name: { type: String, required: true },
    contact_person: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('InventorySupplier', inventorySupplierSchema);
