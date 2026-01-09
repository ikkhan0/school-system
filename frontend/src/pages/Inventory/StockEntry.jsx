import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Save, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const StockEntry = () => {
    const { user } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [stores, setStores] = useState([]);
    const [formData, setFormData] = useState({
        item_id: '',
        quantity: '',
        unit_price: '',
        supplier_id: '',
        store_id: '',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = user?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [itemsRes, suppRes, storesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/inventory/items`, config),
                    axios.get(`${API_URL}/api/inventory/suppliers`, config),
                    axios.get(`${API_URL}/api/inventory/stores`, config)
                ]);
                setItems(itemsRes.data);
                setSuppliers(suppRes.data);
                setStores(storesRes.data);
            } catch (error) {
                toast.error('Failed to load form data');
            }
        };
        fetchData();
    }, [user?.token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = user?.token;
            await axios.post(`${API_URL}/api/inventory/purchase`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Stock added successfully');
            setFormData({
                item_id: '', quantity: '', unit_price: '', supplier_id: '', store_id: '',
                date: new Date().toISOString().split('T')[0], remarks: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add stock');
        }
    };

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Add Item Stock</h1>
                    <p className="text-gray-500 mt-1">Record new stock purchases</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Item *</label>
                                <select
                                    name="item_id"
                                    required
                                    value={formData.item_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                >
                                    <option value="">Select Item</option>
                                    {items.map(item => (
                                        <option key={item._id} value={item._id}>{item.name} ({item.unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier *</label>
                                <select
                                    name="supplier_id"
                                    required
                                    value={formData.supplier_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Store *</label>
                                <select
                                    name="store_id"
                                    required
                                    value={formData.store_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                >
                                    <option value="">Select Store</option>
                                    {stores.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    required
                                    min="1"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                                <input
                                    type="number"
                                    name="unit_price"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.unit_price}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description/Remarks</label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Save size={20} />
                                <span>Save Stock Entry</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StockEntry;
