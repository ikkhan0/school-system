import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Phone, MessageCircle, User, Edit, Plus, Upload, Trash2 } from 'lucide-react';
import API_URL from '../config';

const Students = () => {
    const { user } = useContext(AuthContext);
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [statusFilter, setStatusFilter] = useState('active'); // 'active' or 'deactivated'

    useEffect(() => {
        if (!user) return;
        fetchStudents();
        fetchClasses();
    }, [user]);

    useEffect(() => {
        let result = students;

        // Filter by status
        if (statusFilter === 'active') {
            result = result.filter(s => s.is_active !== false); // Show active students
        } else {
            result = result.filter(s => s.is_active === false); // Show deactivated students
        }

        // Filter by class
        if (filterClass) {
            result = result.filter(s => s.class_id === filterClass);
        }

        // Filter by search term
        if (searchTerm) {
            result = result.filter(s =>
                s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredStudents(result);
    }, [students, filterClass, searchTerm, statusFilter]);

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/students/list`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStudents(response.data);
            setFilteredStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const sendWhatsApp = (mobile) => {
        if (!mobile) return alert("No Mobile Number");
        let num = mobile.replace(/\\D/g, '');
        if (num.length === 11 && num.startsWith('0')) num = '92' + num.substring(1);
        window.open(`https://wa.me/${num}`, '_blank');
    };

    const handleViewProfile = (student) => {
        navigate(`/student-profile/${student._id}`);
    };

    const handleToggleStatus = async (studentId, studentName, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${studentName}?`)) return;

        try {
            await axios.put(`${API_URL}/api/students/${studentId}`,
                { is_active: !currentStatus },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            alert(`Student ${action}d successfully`);
            fetchStudents();
        } catch (error) {
            console.error(error);
            alert(`Failed to ${action} student`);
        }
    };

    const handleDeleteStudent = async (studentId, studentName) => {
        if (!confirm(`⚠️ PERMANENT DELETE\n\nAre you sure you want to permanently delete ${studentName}?\n\nThis action CANNOT be undone!`)) return;

        // Double confirmation for safety
        if (!confirm(`Final confirmation: Delete ${studentName} permanently?`)) return;

        try {
            await axios.delete(`${API_URL}/api/students/${studentId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Student deleted permanently');
            fetchStudents();
        } catch (error) {
            console.error(error);
            alert(`Failed to delete student: ${error.response?.data?.message || error.message}`);
        }
    };


    return (
        <div className="p-3 sm:p-4 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{t('students')}</h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => navigate('/students/import')}
                            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                        >
                            <Upload size={18} className="sm:w-5 sm:h-5" />
                            <span>Import</span>
                        </button>
                        <button
                            onClick={() => navigate('/students/add')}
                            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                        >
                            <Plus size={18} className="sm:w-5 sm:h-5" />
                            <span>Add New</span>
                        </button>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold transition ${statusFilter === 'active'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Active Students
                    </button>
                    <button
                        onClick={() => setStatusFilter('deactivated')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold transition ${statusFilter === 'deactivated'
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Deactivated Students
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Name or Roll No..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Student Count */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredStudents.length} of {students.length} students
                </div>

                {/* Student Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredStudents.map(student => (
                        <div key={student._id} className="border-2 border-blue-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition bg-gradient-to-br from-white to-blue-50">
                            {/* Student Header */}
                            <div className="flex items-start gap-2 sm:gap-3 mb-3">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                    {student.photo ? (
                                        <img
                                            src={student.photo.startsWith('http') ? student.photo : `${API_URL}${student.photo}`}
                                            alt={student.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-full h-full p-3 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">{student.full_name}</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">Roll: <span className="font-semibold text-blue-600">{student.roll_no}</span></p>
                                    <p className="text-xs sm:text-sm text-gray-600 truncate">Father: {student.father_name || student.family_id?.father_name}</p>
                                </div>
                            </div>

                            {/* Student Info */}
                            <div className="space-y-1 mb-3 text-sm">
                                <p className="text-gray-700">
                                    <span className="font-semibold">Class:</span> {student.class_id}-{student.section_id}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold">Contact:</span> {student.family_id?.father_mobile || student.father_mobile || 'N/A'}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold">Fee:</span> Rs. {student.monthly_fee || 5000}
                                </p>
                            </div>

                            {/* Subjects */}
                            {student.enrolled_subjects && student.enrolled_subjects.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                        Subjects ({student.enrolled_subjects.filter(es => es.is_active).length})
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {student.enrolled_subjects
                                            .filter(es => es.is_active)
                                            .slice(0, 3)
                                            .map((es, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                                    {es.subject_id?.name || 'N/A'}
                                                </span>
                                            ))}
                                        {student.enrolled_subjects.filter(es => es.is_active).length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                +{student.enrolled_subjects.filter(es => es.is_active).length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="grid grid-cols-6 gap-1 sm:gap-2">
                                <button
                                    onClick={() => sendWhatsApp(student.family_id?.father_mobile || student.father_mobile)}
                                    className="flex flex-col items-center justify-center p-1.5 sm:p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                    title="WhatsApp"
                                >
                                    <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">WA</span>
                                </button>
                                <button
                                    onClick={() => window.location.href = `tel:${student.family_id?.father_mobile || student.father_mobile}`}
                                    className="flex flex-col items-center justify-center p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                    title="Call"
                                >
                                    <Phone size={18} />
                                    <span className="text-xs mt-1">CALL</span>
                                </button>
                                <button
                                    onClick={() => handleViewProfile(student)}
                                    className="flex flex-col items-center justify-center p-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                    title="Profile"
                                >
                                    <User size={18} />
                                    <span className="text-xs mt-1">PROF</span>
                                </button>
                                <button
                                    onClick={() => navigate(`/students/edit/${student._id}`)}
                                    className="flex flex-col items-center justify-center p-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                    <span className="text-xs mt-1">EDIT</span>
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(student._id, student.full_name, student.is_active)}
                                    className={`flex flex-col items-center justify-center p-2 rounded ${student.is_active
                                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                    title={student.is_active ? 'Deactivate' : 'Activate'}
                                >
                                    <div className="relative">
                                        <User size={18} />
                                        {!student.is_active && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <span className="text-xs mt-1">{student.is_active ? 'DEACT' : 'ACT'}</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteStudent(student._id, student.full_name)}
                                    className="flex flex-col items-center justify-center p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                    title="Delete Permanently"
                                >
                                    <Trash2 size={18} />
                                    <span className="text-xs mt-1">DEL</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredStudents.length === 0 && (
                    <div className="text-center py-12">
                        <User size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No students found</p>
                        <button
                            onClick={() => navigate('/students/add')}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Add First Student
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Students;
