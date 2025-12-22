import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Plus, Edit, Trash2, Save, X, Award, Users, DollarSign } from 'lucide-react';
import API_URL from '../config';

const DiscountPolicies = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [formData, setFormData] = useState({
        policy_name: '',
        policy_type: 'Custom',
        discount_mode: 'Percentage',
        discount_percentage: 0,
        discount_amount: 0,
        is_active: true,
        description: ''
    });

    useEffect(() => {
        if (!user) return;
        fetchPolicies();
    }, [user]);

    const fetchPolicies = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/discounts/policies`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setPolicies(response.data);
        } catch (error) {
            console.error('Error fetching policies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPolicy) {
                await axios.put(`${API_URL}/api/discounts/policy/${editingPolicy._id}`, formData, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            } else {
                await axios.post(`${API_URL}/api/discounts/policy`, formData, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            }

            fetchPolicies();
            resetForm();
            alert('Policy saved successfully!');
        } catch (error) {
            console.error('Error saving policy:', error);
            alert('Failed to save policy');
        }
    };

    const handleEdit = (policy) => {
        setEditingPolicy(policy);
        setFormData({
            policy_name: policy.policy_name,
            policy_type: policy.policy_type,
            discount_mode: policy.discount_mode,
            discount_percentage: policy.discount_percentage,
            discount_amount: policy.discount_amount,
            is_active: policy.is_active,
            description: policy.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this policy?')) return;

        try {
            await axios.delete(`${API_URL}/api/discounts/policy/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchPolicies();
            alert('Policy deleted successfully!');
        } catch (error) {
            console.error('Error deleting policy:', error);
            alert('Failed to delete policy');
        }
    };

    const resetForm = () => {
        setFormData({
            policy_name: '',
            policy_type: 'Custom',
            discount_mode: 'Percentage',
            discount_percentage: 0,
            discount_amount: 0,
            is_active: true,
            description: ''
        });
        setEditingPolicy(null);
        setShowModal(false);
    };

    const getPolicyIcon = (type) => {
        switch (type) {
            case 'Staff Child': return <Users className="text-blue-600" />;
            case 'Sibling': return <Users className="text-green-600" />;
            case 'Merit': return <Award className="text-yellow-600" />;
            case 'Financial Aid': return <DollarSign className="text-purple-600" />;
            default: return <DollarSign className="text-gray-600" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Discount Policies</h1>
                        <p className="text-gray-600">Manage fee discount policies for your school</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Add Policy
                    </button>
                </div>

                {/* Policies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {policies.map(policy => (
                        <div key={policy._id} className="border-2 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {getPolicyIcon(policy.policy_type)}
                                    <div>
                                        <h3 className="font-bold text-lg">{policy.policy_name}</h3>
                                        <p className="text-sm text-gray-600">{policy.policy_type}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${policy.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {policy.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="mb-3">
                                <p className="text-2xl font-bold text-blue-600">
                                    {policy.discount_mode === 'Percentage'
                                        ? `${policy.discount_percentage}%`
                                        : `Rs. ${policy.discount_amount}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {policy.discount_mode === 'Percentage' ? 'Percentage Discount' : 'Fixed Amount'}
                                </p>
                            </div>

                            {policy.description && (
                                <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(policy)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                >
                                    <Edit size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(policy._id)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {policies.length === 0 && (
                    <div className="text-center py-12">
                        <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No discount policies found</p>
                        <p className="text-gray-400">Create your first policy to get started</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">{editingPolicy ? 'Edit Policy' : 'Add New Policy'}</h2>
                            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Policy Name *</label>
                                <input
                                    type="text"
                                    value={formData.policy_name}
                                    onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Policy Type *</label>
                                <select
                                    value={formData.policy_type}
                                    onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="Staff Child">Staff Child</option>
                                    <option value="Sibling">Sibling</option>
                                    <option value="Merit">Merit</option>
                                    <option value="Financial Aid">Financial Aid</option>
                                    <option value="Early Payment">Early Payment</option>
                                    <option value="Custom">Custom</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Discount Mode *</label>
                                <select
                                    value={formData.discount_mode}
                                    onChange={(e) => setFormData({ ...formData, discount_mode: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="Percentage">Percentage</option>
                                    <option value="Fixed Amount">Fixed Amount</option>
                                </select>
                            </div>

                            {formData.discount_mode === 'Percentage' ? (
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Discount Percentage (%) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.discount_percentage}
                                        onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Discount Amount (Rs.) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.discount_amount}
                                        onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) })}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    rows="3"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-semibold">Active</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <Save size={18} />
                                    Save Policy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscountPolicies;
