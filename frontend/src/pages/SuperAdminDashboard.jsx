import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

//Configure axios base URL
axios.defaults.baseURL = API_URL;

const SuperAdminDashboard = () => {
    const [schools, setSchools] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFeaturesModal, setShowFeaturesModal] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState(null);
    const [selectedSchoolForFeatures, setSelectedSchoolForFeatures] = useState(null);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        // Check if user is super admin
        if (user.role !== 'super_admin') {
            navigate('/login');
            return;
        }

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [schoolsRes, statsRes] = await Promise.all([
                axios.get('/api/super-admin/tenants', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/super-admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setSchools(schoolsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/super-admin/login');
    };

    const handleImpersonate = async (tenantId) => {
        try {
            const response = await axios.post(
                `/api/super-admin/impersonate/${tenantId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Store impersonation token and user
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('impersonating', 'true');

            // IMPORTANT: Force page reload to re-initialize AuthContext with new user
            // This ensures ProtectedRoute recognizes the impersonated session
            window.location.href = '/dashboard';
        } catch (error) {
            alert('Failed to impersonate: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const toggleSchoolStatus = async (schoolId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

        try {
            await axios.patch(
                `/api/super-admin/tenants/${schoolId}/status`,
                { subscription_status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchData(); // Refresh data
        } catch (error) {
            alert('Failed to update status: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const handleDeleteSchool = async (schoolId, schoolName) => {
        if (!window.confirm(`Are you sure you want to delete "${schoolName}"?\n\nThis will permanently delete:\n- All students\n- All staff\n- All classes\n- All fees\n- All exams\n- All data for this school\n\nThis action CANNOT be undone!`)) {
            return;
        }

        try {
            await axios.delete(
                `/api/super-admin/tenants/${schoolId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('School deleted successfully');
            fetchData(); // Refresh data
        } catch (error) {
            alert('Failed to delete school: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                                <p className="text-sm text-gray-600">System-wide Management</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                            <button
                                onClick={() => setShowSettingsModal(true)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                                title="Settings"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Schools</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTenants || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeTenants || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Inactive</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{stats.inactiveTenants || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Trial</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.trialTenants || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schools Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Schools</h2>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition"
                            >
                                + Create School
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {schools.map((school) => (
                                    <tr key={school._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{school.school_name}</div>
                                                <div className="text-sm text-gray-500">{school.contact_info.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-mono text-gray-600">{school.tenant_id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                                                {school.subscription_plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${school.subscription_status === 'Active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {school.subscription_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {school.userCount || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSchool(school);
                                                        setShowUsersModal(true);
                                                    }}
                                                    className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition"
                                                >
                                                    Manage Users
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedSchoolForEdit(school);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-700 border border-green-300 rounded hover:bg-green-50 transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedSchoolForFeatures(school);
                                                        setShowFeaturesModal(true);
                                                    }}
                                                    className="px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 border border-purple-300 rounded hover:bg-purple-50 transition"
                                                >
                                                    Features
                                                </button>
                                                <button
                                                    onClick={() => handleImpersonate(school._id)}
                                                    className="px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50 transition"
                                                >
                                                    Login As
                                                </button>
                                                <button
                                                    onClick={() => toggleSchoolStatus(school._id, school.subscription_status)}
                                                    className={`px-3 py-1 text-xs font-medium rounded transition ${school.subscription_status === 'Active'
                                                        ? 'text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50'
                                                        : 'text-green-600 hover:text-green-700 border border-green-300 hover:bg-green-50'
                                                        }`}
                                                >
                                                    {school.subscription_status === 'Active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSchool(school._id, school.school_name)}
                                                    className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {schools.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="mt-4 text-gray-600">No schools yet. Create your first school!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create School Modal */}
            {showCreateModal && (
                <CreateSchoolModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchData();
                    }}
                    token={token}
                />
            )}

            {/* User Management Modal */}
            {showUsersModal && selectedSchool && (
                <UserManagementModal
                    school={selectedSchool}
                    onClose={() => {
                        setShowUsersModal(false);
                        setSelectedSchool(null);
                    }}
                    token={token}
                />
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <SettingsModal
                    onClose={() => setShowSettingsModal(false)}
                    token={token}
                    user={user}
                />
            )}

            {/* Edit School Modal */}
            {showEditModal && selectedSchoolForEdit && (
                <EditSchoolModal
                    school={selectedSchoolForEdit}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedSchoolForEdit(null);
                    }}
                    onSuccess={() => {
                        setShowEditModal(false);
                        setSelectedSchoolForEdit(null);
                        fetchData();
                    }}
                    token={token}
                />
            )}

            {/* Feature Management Modal */}
            {showFeaturesModal && selectedSchoolForFeatures && (
                <FeatureManagementModal
                    school={selectedSchoolForFeatures}
                    onClose={() => {
                        setShowFeaturesModal(false);
                        setSelectedSchoolForFeatures(null);
                    }}
                    onSuccess={() => {
                        setShowFeaturesModal(false);
                        setSelectedSchoolForFeatures(null);
                        fetchData();
                    }}
                    token={token}
                />
            )}
        </div>
    );
};

// Create School Modal Component
const CreateSchoolModal = ({ onClose, onSuccess, token }) => {
    const [formData, setFormData] = useState({
        school_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        admin_username: '',
        admin_password: '',
        admin_name: '',
        admin_email: '',
        subscription_plan: 'Basic',
        features: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const availableFeatures = ['core', 'fees', 'exams', 'attendance', 'reports', 'sms', 'transport'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('/api/super-admin/tenants', {
                school_name: formData.school_name,
                contact_info: {
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    country: 'Pakistan'
                },
                subscription_plan: formData.subscription_plan,
                features_enabled: formData.features.length > 0 ? formData.features : ['core'],
                admin_username: formData.admin_username,
                admin_password: formData.admin_password,
                admin_name: formData.admin_name,
                admin_email: formData.admin_email
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create school');
        } finally {
            setLoading(false);
        }
    };

    const toggleFeature = (feature) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Create New School</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* School Info */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">School Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.school_name}
                                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Green Valley School"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="info@school.edu.pk"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="+923001234567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Lahore"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Main Road"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Admin User */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Admin User</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.admin_name}
                                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.admin_email}
                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="admin@school.edu.pk"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.admin_username}
                                    onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="admin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.admin_password}
                                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Min 6 characters"
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subscription */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Subscription</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {['Free', 'Basic', 'Premium', 'Enterprise'].map(plan => (
                                <button
                                    key={plan}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, subscription_plan: plan })}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${formData.subscription_plan === plan
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {plan}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {availableFeatures.map(feature => (
                                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.features.includes(feature)}
                                        onChange={() => toggleFeature(feature)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 capitalize">{feature}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create School'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// User Management Modal Component
const UserManagementModal = ({ school, onClose, token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`/api/super-admin/tenants/${school._id}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Manage Users</h3>
                            <p className="text-sm text-gray-600 mt-1">{school.school_name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">No users found for this school.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.username}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{user.full_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowResetModal(true);
                                                    }}
                                                    className="px-3 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 border border-orange-300 rounded hover:bg-orange-50 transition"
                                                >
                                                    Reset Password
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Password Reset Modal */}
            {showResetModal && selectedUser && (
                <PasswordResetModal
                    user={selectedUser}
                    onClose={() => {
                        setShowResetModal(false);
                        setSelectedUser(null);
                    }}
                    token={token}
                />
            )}
        </div>
    );
};

// Password Reset Modal Component
const PasswordResetModal = ({ user, onClose, token }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await axios.patch(`/api/super-admin/users/${user._id}/password`, {
                new_password: newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">User: {user.username} ({user.full_name})</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                            <p className="text-sm">Password reset successfully!</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Min 6 characters"
                            minLength={6}
                            disabled={success}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Re-enter password"
                            disabled={success}
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : success ? 'Done!' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Settings Modal Component
const SettingsModal = ({ onClose, token, user }) => {
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/super-admin/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData(prev => ({
                ...prev,
                name: response.data.name || '',
                email: response.data.email || '',
                phone: response.data.phone || ''
            }));
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate password change if attempted
        if (formData.new_password) {
            if (!formData.current_password) {
                setError('Current password is required to change password');
                return;
            }
            if (formData.new_password.length < 6) {
                setError('New password must be at least 6 characters');
                return;
            }
            if (formData.new_password !== formData.confirm_password) {
                setError('New passwords do not match');
                return;
            }
        }

        setLoading(true);

        try {
            const updateData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            };

            if (formData.new_password) {
                updateData.current_password = formData.current_password;
                updateData.new_password = formData.new_password;
            }

            const response = await axios.patch('/api/super-admin/profile', updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(response.data.message);

            // Update local storage with new user data
            const updatedUser = {
                ...user,
                name: response.data.profile.name,
                email: response.data.profile.email
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));

            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Settings</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                            <p className="text-sm">{success}</p>
                        </div>
                    )}

                    {/* Profile Information */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Profile Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="+923001234567"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Change Password</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={formData.current_password}
                                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Leave blank to keep current password"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={formData.new_password}
                                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Min 6 characters"
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Re-enter password"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit School Modal Component
const EditSchoolModal = ({ school, onClose, onSuccess, token }) => {
    const [formData, setFormData] = useState({
        school_name: school.school_name || '',
        phone: school.contact_info?.phone || '',
        email: school.contact_info?.email || '',
        city: school.contact_info?.city || '',
        address: school.contact_info?.address || '',
        logo: school.logo || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.patch(`/api/super-admin/tenants/${school._id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('School updated successfully!');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update school');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Edit School</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* School Information */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">School Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.school_name}
                                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="school@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="+92 300 1234567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Islamabad"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                                <input
                                    type="text"
                                    value={formData.logo}
                                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Full address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Feature Management Modal Component
const FeatureManagementModal = ({ school, onClose, onSuccess, token }) => {
    const AVAILABLE_FEATURES = [
        { id: 'core', name: 'Core Features', description: 'Basic school management (Always On)', disabled: true },
        { id: 'attendance', name: 'Attendance Management', description: 'Mark and track student attendance' },
        { id: 'exams', name: 'Exam & Results', description: 'Create exams and manage results' },
        { id: 'fees', name: 'Fee Management', description: 'Fee collection and tracking' },
        { id: 'reports', name: 'Advanced Reports', description: 'Detailed analytics and reports' },
        { id: 'sms', name: 'SMS Notifications', description: 'Send SMS to parents' },
        { id: 'whatsapp', name: 'WhatsApp Integration', description: 'WhatsApp messaging' },
        { id: 'analytics', name: 'Analytics Dashboard', description: 'Advanced analytics and insights' }
    ];

    const [features, setFeatures] = useState(school.features_enabled || ['core']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleFeature = (featureId) => {
        if (featureId === 'core') return; // Core can't be disabled

        setFeatures(prev => {
            if (prev.includes(featureId)) {
                return prev.filter(f => f !== featureId);
            } else {
                return [...prev, featureId];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.patch(`/api/super-admin/tenants/${school._id}/features`,
                { features_enabled: features },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Features updated successfully!');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update features');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Manage Features</h3>
                            <p className="text-sm text-gray-600 mt-1">{school.school_name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {AVAILABLE_FEATURES.map(feature => (
                            <div key={feature.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    id={feature.id}
                                    checked={features.includes(feature.id)}
                                    onChange={() => toggleFeature(feature.id)}
                                    disabled={feature.disabled}
                                    className="mt-1 h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <label htmlFor={feature.id} className="flex-1 cursor-pointer">
                                    <div className="font-medium text-gray-900">{feature.name}</div>
                                    <div className="text-sm text-gray-600">{feature.description}</div>
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <p className="text-sm text-blue-700">
                            <strong>Note:</strong> Disabling a feature will hide it from the school's navigation and block API access.
                        </p>
                    </div>

                    <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Features'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
