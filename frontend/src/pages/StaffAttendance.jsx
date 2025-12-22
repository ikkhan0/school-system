import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Calendar, Check, X, Clock, Coffee, ArrowLeft, Save, Users } from 'lucide-react';
import API_URL from '../config';

const StaffAttendance = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchStaff();
        fetchAttendance();
    }, [user, selectedDate]);

    const fetchStaff = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/staff/list?status=active`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStaff(response.data);

            // Initialize attendance state for all staff
            const initialAttendance = {};
            response.data.forEach(member => {
                initialAttendance[member._id] = {
                    staff_id: member._id,
                    date: selectedDate,
                    status: 'Present',
                    check_in_time: '',
                    check_out_time: '',
                    notes: ''
                };
            });
            setAttendance(initialAttendance);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/staff/attendance/daily?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Update attendance state with existing records
            const existingAttendance = {};
            response.data.forEach(record => {
                existingAttendance[record.staff_id._id || record.staff_id] = {
                    staff_id: record.staff_id._id || record.staff_id,
                    date: selectedDate,
                    status: record.status,
                    check_in_time: record.check_in_time || '',
                    check_out_time: record.check_out_time || '',
                    leave_type: record.leave_type || '',
                    notes: record.notes || ''
                };
            });

            setAttendance(prev => ({ ...prev, ...existingAttendance }));
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const handleStatusChange = (staffId, status) => {
        setAttendance(prev => ({
            ...prev,
            [staffId]: {
                ...prev[staffId],
                status,
                leave_type: status === 'Leave' ? prev[staffId]?.leave_type || 'Casual' : ''
            }
        }));
    };

    const handleMarkAll = (status) => {
        const updated = {};
        staff.forEach(member => {
            updated[member._id] = {
                ...attendance[member._id],
                status
            };
        });
        setAttendance(updated);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const attendanceRecords = Object.values(attendance);

            await axios.post(`${API_URL}/api/staff/attendance/mark`,
                { attendanceRecords },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            alert('Attendance saved successfully!');
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Failed to save attendance');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-700 border-green-300';
            case 'Absent': return 'bg-red-100 text-red-700 border-red-300';
            case 'Leave': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'Half-Day': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'Late': return 'bg-orange-100 text-orange-700 border-orange-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present': return <Check size={16} />;
            case 'Absent': return <X size={16} />;
            case 'Leave': return <Coffee size={16} />;
            case 'Half-Day': return <Clock size={16} />;
            case 'Late': return <Clock size={16} />;
            default: return null;
        }
    };

    const summary = {
        total: staff.length,
        present: Object.values(attendance).filter(a => a.status === 'Present').length,
        absent: Object.values(attendance).filter(a => a.status === 'Absent').length,
        leave: Object.values(attendance).filter(a => a.status === 'Leave').length,
        halfDay: Object.values(attendance).filter(a => a.status === 'Half-Day').length,
        late: Object.values(attendance).filter(a => a.status === 'Late').length
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Users size={32} className="text-purple-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Staff Attendance</h1>
                            <p className="text-sm text-gray-600">Mark daily attendance for all staff members</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/staff')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        <ArrowLeft size={18} />
                        Back to Staff
                    </button>
                </div>

                {/* Date Selector */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        <label className="font-semibold text-gray-700">Date:</label>
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="ml-auto flex gap-2">
                        <button
                            onClick={() => handleMarkAll('Present')}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                            Mark All Present
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
                        <p className="text-xs text-gray-600">Total Staff</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-700">{summary.present}</p>
                        <p className="text-xs text-green-600">Present</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-700">{summary.absent}</p>
                        <p className="text-xs text-red-600">Absent</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-700">{summary.leave}</p>
                        <p className="text-xs text-blue-600">On Leave</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-700">{summary.halfDay}</p>
                        <p className="text-xs text-yellow-600">Half Day</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-700">{summary.late}</p>
                        <p className="text-xs text-orange-600">Late</p>
                    </div>
                </div>

                {/* Attendance List */}
                <div className="space-y-3">
                    {staff.map(member => (
                        <div key={member._id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-center gap-4">
                                {/* Staff Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                        {member.photo ? (
                                            <img src={`${API_URL}${member.photo}`} alt={member.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className="w-full h-full p-2 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{member.full_name}</h3>
                                        <p className="text-sm text-gray-600">{member.designation} • {member.employee_id}</p>
                                    </div>
                                </div>

                                {/* Status Buttons */}
                                <div className="flex gap-2">
                                    {['Present', 'Absent', 'Leave', 'Half-Day', 'Late'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(member._id, status)}
                                            className={`flex items-center gap-1 px-3 py-2 rounded-lg border-2 transition ${attendance[member._id]?.status === status
                                                    ? getStatusColor(status) + ' font-bold'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {getStatusIcon(status)}
                                            <span className="text-xs">{status}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Leave Type (if on leave) */}
                                {attendance[member._id]?.status === 'Leave' && (
                                    <select
                                        value={attendance[member._id]?.leave_type || 'Casual'}
                                        onChange={(e) => setAttendance(prev => ({
                                            ...prev,
                                            [member._id]: { ...prev[member._id], leave_type: e.target.value }
                                        }))}
                                        className="px-3 py-2 border rounded text-sm"
                                    >
                                        <option value="Casual">Casual</option>
                                        <option value="Sick">Sick</option>
                                        <option value="Annual">Annual</option>
                                        <option value="Unpaid">Unpaid</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {staff.length === 0 && (
                    <div className="text-center py-12">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No active staff members found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffAttendance;
