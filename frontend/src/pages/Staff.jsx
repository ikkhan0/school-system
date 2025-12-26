import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import SettingsContext from '../context/SettingsContext';
import { formatDate } from '../utils/dateFormatter';
import { Search, Phone, MessageCircle, User, Edit, Plus, UserCheck, Calendar } from 'lucide-react';
import API_URL from '../config';

const Staff = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { dateFormat } = useContext(SettingsContext);
    const [staff, setStaff] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDesignation, setFilterDesignation] = useState('');
    const [filterStatus, setFilterStatus] = useState('active');

    const designations = [
        'Principal', 'Vice Principal', 'Head Teacher', 'Senior Teacher', 'Teacher',
        'Subject Teacher', 'Class Teacher', 'Admin Officer', 'Accountant',
        'Librarian', 'Lab Assistant', 'Peon', 'Watchman', 'Cleaner', 'Driver', 'Other'
    ];

    useEffect(() => {
        if (!user) return;
        fetchStaff();
    }, [user, filterStatus]);

    useEffect(() => {
        let result = staff;
        if (filterDesignation) {
            result = result.filter(s => s.designation === filterDesignation);
        }
        if (searchTerm) {
            result = result.filter(s =>
                s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredStaff(result);
    }, [staff, filterDesignation, searchTerm]);

    const fetchStaff = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/staff/list?status=${filterStatus}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStaff(response.data);
            setFilteredStaff(response.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const sendWhatsApp = (mobile) => {
        if (!mobile) return alert("No Mobile Number");
        let num = mobile.replace(/\\D/g, '');
        if (num.length === 11 && num.startsWith('0')) num = '92' + num.substring(1);
        window.open(`https://wa.me/${num}`, '_blank');
    };

    const handleToggleStatus = async (staffId, staffName, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${staffName}?`)) return;

        try {
            await axios.put(`${API_URL}/api/staff/${staffId}`,
                { is_active: !currentStatus },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            alert(`Staff ${action}d successfully`);
            fetchStaff();
        } catch (error) {
            console.error(error);
            alert(`Failed to ${action} staff`);
        }
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/staff/attendance')}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md"
                        >
                            <Calendar size={20} />
                            Staff Attendance
                        </button>
                        <button
                            onClick={() => navigate('/staff/add')}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
                        >
                            <Plus size={20} />
                            Add New Staff
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex gap-4 mb-6 flex-wrap">
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Name or Employee ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterDesignation}
                        onChange={(e) => setFilterDesignation(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Designations</option>
                        {designations.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="active">Active Only</option>
                        <option value="">All Staff</option>
                    </select>
                </div>

                {/* Staff Count */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredStaff.length} of {staff.length} staff members
                </div>

                {/* Staff Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map(member => (
                        <div key={member._id} className="border-2 border-purple-200 rounded-lg p-4 hover:shadow-lg transition bg-gradient-to-br from-white to-purple-50">
                            {/* Staff Header */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                    {member.photo ? (
                                        <img src={`${API_URL}${member.photo}`} alt={member.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full p-3 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800">{member.full_name}</h3>
                                    <p className="text-sm text-gray-600">ID: <span className="font-semibold text-purple-600">{member.employee_id}</span></p>
                                    <p className="text-sm text-purple-700 font-semibold">{member.designation}</p>
                                </div>
                            </div>

                            {/* Staff Info */}
                            <div className="space-y-1 mb-3 text-sm">
                                <p className="text-gray-700">
                                    <span className="font-semibold">Department:</span> {member.department || 'N/A'}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold">Contact:</span> {member.mobile || 'N/A'}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold">Salary:</span> Rs. {member.basic_salary?.toLocaleString() || 'N/A'}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold">Joined:</span> {member.joining_date ? formatDate(member.joining_date, dateFormat) : 'N/A'}
                                </p>
                            </div>

                            {/* Subjects (for teachers/academic staff only) */}
                            {member.assigned_subjects && member.assigned_subjects.length > 0 && (
                                member.designation === 'Teacher' ||
                                member.designation === 'Subject Teacher' ||
                                member.designation === 'Class Teacher' ||
                                member.designation === 'Senior Teacher' ||
                                member.designation === 'Head Teacher'
                            ) && (
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-gray-600 mb-1">
                                            Subjects ({member.assigned_subjects.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {member.assigned_subjects.slice(0, 3).map((sub, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                                    {sub.subject_id?.name || 'N/A'}
                                                </span>
                                            ))}
                                            {member.assigned_subjects.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                    +{member.assigned_subjects.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Action Buttons */}
                            <div className="grid grid-cols-5 gap-2">
                                <button
                                    onClick={() => sendWhatsApp(member.mobile)}
                                    className="flex flex-col items-center justify-center p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                    title="WhatsApp"
                                >
                                    <MessageCircle size={18} />
                                    <span className="text-xs mt-1">WA</span>
                                </button>
                                <button
                                    onClick={() => window.location.href = `tel:${member.mobile}`}
                                    className="flex flex-col items-center justify-center p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                    title="Call"
                                >
                                    <Phone size={18} />
                                    <span className="text-xs mt-1">CALL</span>
                                </button>
                                <button
                                    onClick={() => navigate(`/staff/profile/${member._id}`)}
                                    className="flex flex-col items-center justify-center p-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                    title="Profile"
                                >
                                    <User size={18} />
                                    <span className="text-xs mt-1">PROF</span>
                                </button>
                                <button
                                    onClick={() => navigate(`/staff/edit/${member._id}`)}
                                    className="flex flex-col items-center justify-center p-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                    <span className="text-xs mt-1">EDIT</span>
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(member._id, member.full_name, member.is_active)}
                                    className={`flex flex-col items-center justify-center p-2 rounded ${member.is_active
                                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                    title={member.is_active ? 'Deactivate' : 'Activate'}
                                >
                                    <UserCheck size={18} />
                                    <span className="text-xs mt-1">{member.is_active ? 'DEACT' : 'ACT'}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredStaff.length === 0 && (
                    <div className="text-center py-12">
                        <User size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No staff members found</p>
                        <button
                            onClick={() => navigate('/staff/add')}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Add First Staff Member
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Staff;
