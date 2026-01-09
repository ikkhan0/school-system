import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const InventoryItems = () => {
    const { user } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', category_id: '', unit: '', item_type: 'CONSUMABLE', description: ''
    });
    const [editingId, setEditingId] = useState(null);

    const fetchData = async () => {
        try {
            const token = user?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [itemsRes, catsRes] = await Promise.all([
                axios.get(`${API_URL}/api/inventory/items`, config),
                axios.get(`${API_URL}/api/inventory/categories`, config)
            ]);

            setItems(itemsRes.data);
            setCategories(catsRes.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load data');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = user?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editingId) {
                await axios.put(`${API_URL}/api/inventory/items/${editingId}`, formData, config);
                toast.success('Item updated successfully');
            } else {
                await axios.post(`${API_URL}/api/inventory/items`, formData, config);
                toast.success('Item added successfully');
            }

            setIsModalOpen(false);
            setFormData({ name: '', category_id: '', unit: '', item_type: 'CONSUMABLE', description: '' });
            setEditingId(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save item');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            category_id: item.category_id?._id || item.category_id, // Handle populated or unpopulated
            unit: item.unit,
            item_type: item.item_type,
            description: item.description
        });
        setEditingId(item._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const token = user?.token;
            await axios.delete(`${API_URL}/api/inventory/items/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Item deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Items</h1>
                        <p className="text-gray-500 mt-1">Manage item registry</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ name: '', category_id: '', unit: '', item_type: 'CONSUMABLE', description: '' });
                                setEditingId(null);
                                setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span>Add Item</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Stock</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No items found</td></tr>
                                ) : (
                                    filtered.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{item.category_id?.name || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <span className={`px-2 py-1 rounded-full text-xs ${item.item_type === 'FIXED_ASSET' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                    {item.item_type === 'FIXED_ASSET' ? 'Fixed Asset' : 'Consumable'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{item.unit}</td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{item.current_stock}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-blue-600">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item._id)} className="p-1 text-gray-400 hover:text-red-600">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            required
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. pcs, box, kg"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                                    <select
                                        value={formData.item_type}
                                        onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                    >
                                        <option value="CONSUMABLE">Consumable (e.g. Paper, Chalk)</option>
                                        <option value="FIXED_ASSET">Fixed Asset (e.g. Projector, Furniture)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryItems;
