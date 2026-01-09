import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const InventoryStores = () => {
    const { user } = useContext(AuthContext);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', description: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchStores = async () => {
        try {
            const token = user?.token;
            const response = await axios.get(`${API_URL}/api/inventory/stores`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStores(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stores:', error);
            toast.error('Failed to load stores');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = user?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editingId) {
                await axios.put(`${API_URL}/api/inventory/stores/${editingId}`, formData, config);
                toast.success('Store updated successfully');
            } else {
                await axios.post(`${API_URL}/api/inventory/stores`, formData, config);
                toast.success('Store added successfully');
            }

            setIsModalOpen(false);
            setFormData({ name: '', code: '', description: '' });
            setEditingId(null);
            fetchStores();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save store');
        }
    };

    const handleEdit = (store) => {
        setFormData({ name: store.name, code: store.code, description: store.description });
        setEditingId(store._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this store?')) return;

        try {
            const token = user?.token;
            await axios.delete(`${API_URL}/api/inventory/stores/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Store deleted successfully');
            fetchStores();
        } catch (error) {
            toast.error('Failed to delete store');
        }
    };

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Item Stores</h1>
                        <p className="text-gray-500 mt-1">Manage physical storage locations</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search stores..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ name: '', code: '', description: '' });
                                setEditingId(null);
                                setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span>Add Store</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading...</td></tr>
                                ) : filteredStores.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">No stores found</td></tr>
                                ) : (
                                    filteredStores.map((store) => (
                                        <tr key={store._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{store.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{store.code || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{store.description}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(store)} className="p-1 text-gray-400 hover:text-blue-600">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(store._id)} className="p-1 text-gray-400 hover:text-red-600">
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

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingId ? 'Edit Store' : 'Add New Store'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
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

export default InventoryStores;
