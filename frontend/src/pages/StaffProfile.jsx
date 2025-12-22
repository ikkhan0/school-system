import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, User, Phone, Mail, Calendar, DollarSign, BookOpen, Edit } from 'lucide-react';
import API_URL from '../config';

const StaffProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        if (!user) return;
        fetchStaffProfile();
    }, [user, id]);

    const fetchStaffProfile = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/staff/${id}/profile`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStaff(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching staff profile:', error);
            alert('Failed to load staff profile');
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (!staff) {
        return <div className="p-4 text-center">Staff member not found</div>;
    }

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'employment', label: 'Employment', icon: Calendar },
        { id: 'salary', label: 'Salary', icon: DollarSign },
        { id: 'subjects', label: 'Subjects', icon: BookOpen }
    ];

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start mb-4">
                        <button
                            onClick={() => navigate('/staff')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>
                        <button
                            onClick={() => navigate(`/staff/edit/${id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Edit size={18} />
                            Edit
                        </button>
                    </div>

                    {/* Staff Header Info */}
                    <div className="flex items-start gap-6">
                        <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                            {staff.photo ? (
                                <img src={`${API_URL}${staff.photo}`} alt={staff.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-full h-full p-6 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{staff.full_name}</h1>
                            <p className="text-xl text-purple-600 font-semibold mb-3">{staff.designation}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Employee ID</p>
                                    <p className="font-semibold">{staff.employee_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Department</p>
                                    <p className="font-semibold">{staff.department}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Mobile</p>
                                    <p className="font-semibold">{staff.mobile}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${staff.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {staff.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    <div className="flex gap-2 px-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 font-semibold'
                                        : 'border-transparent text-gray-600 hover:text-blue-600'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Personal Info Tab */}
                    {activeTab === 'personal' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">CNIC</p>
                                            <p className="font-semibold">{staff.cnic || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Date of Birth</p>
                                            <p className="font-semibold">{staff.dob ? new Date(staff.dob).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Gender</p>
                                            <p className="font-semibold">{staff.gender || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Blood Group</p>
                                            <p className="font-semibold">{staff.blood_group || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Religion</p>
                                            <p className="font-semibold">{staff.religion || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-semibold">{staff.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Mobile</p>
                                            <p className="font-semibold">{staff.mobile || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">City</p>
                                            <p className="font-semibold">{staff.city || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Address</p>
                                            <p className="font-semibold">{staff.current_address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Emergency Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-semibold">{staff.emergency_contact_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Mobile</p>
                                        <p className="font-semibold">{staff.emergency_contact_mobile || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Employment Tab */}
                    {activeTab === 'employment' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Employment Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Designation</p>
                                            <p className="font-semibold">{staff.designation || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Department</p>
                                            <p className="font-semibold">{staff.department || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Employment Type</p>
                                            <p className="font-semibold">{staff.employment_type || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Joining Date</p>
                                            <p className="font-semibold">{staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Bank Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Bank Name</p>
                                            <p className="font-semibold">{staff.bank_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Account Number</p>
                                            <p className="font-semibold">{staff.account_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Salary Tab */}
                    {activeTab === 'salary' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Salary Information</h3>
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-600">Basic Salary</p>
                                        <p className="text-2xl font-bold text-green-700">Rs. {staff.basic_salary?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">House Rent</p>
                                        <p className="text-xl font-semibold">Rs. {staff.allowances?.house_rent?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Medical</p>
                                        <p className="text-xl font-semibold">Rs. {staff.allowances?.medical?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Transport</p>
                                        <p className="text-xl font-semibold">Rs. {staff.allowances?.transport?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subjects Tab */}
                    {activeTab === 'subjects' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Assigned Subjects</h3>
                            {staff.assigned_subjects && staff.assigned_subjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {staff.assigned_subjects.map((sub, idx) => (
                                        <div key={idx} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                                            <h4 className="font-bold text-lg text-purple-800">{sub.subject_id?.name || 'N/A'}</h4>
                                            <p className="text-sm text-gray-600">Code: {sub.subject_id?.code || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No subjects assigned</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffProfile;
