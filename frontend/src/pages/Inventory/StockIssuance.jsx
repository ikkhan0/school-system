import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Save, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const StockIssuance = () => {
    const { user } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]); // Staff array
    const [formData, setFormData] = useState({
        item_id: '',
        quantity: '',
        issued_to_user: '', // Staff ID
        department: '',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = user?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [itemsRes, usersRes] = await Promise.all([
                    axios.get(`${API_URL}/api/inventory/items`, config),
                    axios.get(`${API_URL}/api/staff`, config) // Assuming /api/staff returns list of staff
                ]);

                // Filter items with stock > 0
                const availableItems = itemsRes.data.filter(i => i.current_stock > 0);
                setItems(availableItems);
                setUsers(usersRes.data);
            } catch (error) {
                toast.error('Failed to load data');
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
            // Map issued_to_user to issued_to_name automatically if needed
            const selectedStaff = users.find(u => u._id === formData.issued_to_user);
            const payload = {
                ...formData,
                issued_to_name: selectedStaff?.full_name || 'Unknown'
            };

            await axios.post(`${API_URL}/api/inventory/issue`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Item issued successfully');
            setFormData({
                item_id: '', quantity: '', issued_to_user: '', department: '',
                date: new Date().toISOString().split('T')[0], remarks: ''
            });

            // Refresh items to update stock
            const itemsRes = await axios.get(`${API_URL}/api/inventory/items`, { headers: { Authorization: `Bearer ${token}` } });
            setItems(itemsRes.data.filter(i => i.current_stock > 0));

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to issue item');
        }
    };

    const selectedItem = items.find(i => i._id === formData.item_id);

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Issue Item</h1>
                    <p className="text-gray-500 mt-1">Issue stock to staff or departments</p>
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
                                        <option key={item._id} value={item._id}>
                                            {item.name} (Stock: {item.current_stock})
                                        </option>
                                    ))}
                                </select>
                                {selectedItem && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Type: {selectedItem.item_type === 'FIXED_ASSET' ? 'Fixed Asset' : 'Consumable'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Quantity *</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    required
                                    min="1"
                                    max={selectedItem?.current_stock}
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue To (Staff) *</label>
                                <select
                                    name="issued_to_user"
                                    required
                                    value={formData.issued_to_user}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                >
                                    <option value="">Select Staff Member</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.full_name} ({u.employee_id})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
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
                                <span>Issue Item</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StockIssuance;
