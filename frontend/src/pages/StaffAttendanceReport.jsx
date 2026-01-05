import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Calendar, Users, Printer, Filter, Clock } from 'lucide-react';
import API_URL from '../config';

const StaffAttendanceReport = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ summary: [], detailed_logs: [] });
    const [view, setView] = useState('summary'); // 'summary' or 'detailed'
    const [filters, setFilters] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        role: '',
        preset: 'today'
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, filters.start_date, filters.end_date, filters.role]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                start_date: filters.start_date,
                end_date: filters.end_date
            });

            if (filters.role) params.append('role', filters.role);

            const res = await axios.get(`${API_URL}/api/reports/staff-attendance?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setData(res.data);
        } catch (error) {
            console.error('Error fetching staff attendance:', error);
            alert('Failed to load staff attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handlePresetChange = (preset) => {
        const today = new Date();
        let start, end;

        switch (preset) {
            case 'today':
                start = end = today;
                break;
            case 'yesterday':
                start = end = new Date(today.setDate(today.getDate() - 1));
                break;
            case 'week':
                start = new Date(today.setDate(today.getDate() - today.getDay()));
                end = new Date();
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date();
                break;
            case 'last_month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            default:
                return;
        }

        setFilters({
            ...filters,
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0],
            preset
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="text-purple-600" />
                                Staff Attendance Reports
                            </h1>
                            <p className="text-gray-600 mt-1">Track and manage staff attendance</p>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="no-print flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="no-print p-4 border-b bg-gray-50">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('summary')}
                            className={`px-4 py-2 rounded-lg font-semibold ${view === 'summary'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Summary View
                        </button>
                        <button
                            onClick={() => setView('detailed')}
                            className={`px-4 py-2 rounded-lg font-semibold ${view === 'detailed'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Day-wise Detail
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="no-print p-6 border-b bg-gray-50">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Filter size={18} />
                        Filters
                    </h3>

                    {/* Date Presets */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2">Quick Date Range</label>
                        <div className="flex flex-wrap gap-2">
                            {['today', 'yesterday', 'week', 'month', 'last_month', 'custom'].map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetChange(preset)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filters.preset === preset
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white text-gray-700 border hover:bg-gray-100'
                                        }`}
                                >
                                    {preset.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value, preset: 'custom' })}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value, preset: 'custom' })}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Role</label>
                            <select
                                value={filters.role}
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="">All Roles</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Staff">Staff</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading staff attendance...</p>
                        </div>
                    ) : view === 'summary' ? (
                        <SummaryView data={data} />
                    ) : (
                        <DetailedView data={data} />
                    )}
                </div>
            </div>
        </div>
    );
};

const SummaryView = ({ data }) => {
    if (!data.summary || data.summary.length === 0) {
        return (
            <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No staff attendance data found</p>
                <p className="text-gray-400">Try adjusting your filters</p>
            </div>
        );
    }

    const avgAttendance = data.summary.length > 0
        ? (data.summary.reduce((sum, s) => sum + s.percentage, 0) / data.summary.length).toFixed(1)
        : 0;

    return (
        <div>
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Summary Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Staff</p>
                        <p className="text-2xl font-bold text-purple-600">{data.total_staff}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Avg Attendance</p>
                        <p className="text-2xl font-bold text-green-600">{avgAttendance}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Date Range</p>
                        <p className="text-sm font-semibold">
                            {new Date(data.start_date).toLocaleDateString()} - {new Date(data.end_date).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left border">Name</th>
                            <th className="p-3 text-left border">Role</th>
                            <th className="p-3 text-left border">Mobile</th>
                            <th className="p-3 text-center border">Present</th>
                            <th className="p-3 text-center border">Absent</th>
                            <th className="p-3 text-center border">Leave</th>
                            <th className="p-3 text-center border">Half Day</th>
                            <th className="p-3 text-center border">Total</th>
                            <th className="p-3 text-right border">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.summary.map((staff, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 border">
                                <td className="p-3 font-semibold">{staff.name}</td>
                                <td className="p-3">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                        {staff.role}
                                    </span>
                                </td>
                                <td className="p-3 text-sm">{staff.mobile || '-'}</td>
                                <td className="p-3 text-center text-green-600 font-bold">{staff.present}</td>
                                <td className="p-3 text-center text-red-600 font-bold">{staff.absent}</td>
                                <td className="p-3 text-center text-yellow-600 font-bold">{staff.leave}</td>
                                <td className="p-3 text-center text-orange-600 font-bold">{staff.half_day}</td>
                                <td className="p-3 text-center font-semibold">{staff.total}</td>
                                <td className={`p-3 text-right font-bold ${staff.percentage >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                                    {staff.percentage}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DetailedView = ({ data }) => {
    if (!data.detailed_logs || data.detailed_logs.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No daily logs found</p>
                <p className="text-gray-400">Try adjusting your date range</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    Showing {data.detailed_logs.length} attendance records from {new Date(data.start_date).toLocaleDateString()} to {new Date(data.end_date).toLocaleDateString()}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left border">Date</th>
                            <th className="p-3 text-left border">Staff Name</th>
                            <th className="p-3 text-left border">Role</th>
                            <th className="p-3 text-center border">Status</th>
                            <th className="p-3 text-center border">Check In</th>
                            <th className="p-3 text-center border">Check Out</th>
                            <th className="p-3 text-left border">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.detailed_logs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 border">
                                <td className="p-3">{new Date(log.date).toLocaleDateString()}</td>
                                <td className="p-3 font-semibold">{log.name}</td>
                                <td className="p-3">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                        {log.role}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.status === 'Present' ? 'bg-green-100 text-green-700' :
                                            log.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                log.status === 'Half Day' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="p-3 text-center text-sm">
                                    {log.check_in ? new Date(log.check_in).toLocaleTimeString() : '-'}
                                </td>
                                <td className="p-3 text-center text-sm">
                                    {log.check_out ? new Date(log.check_out).toLocaleTimeString() : '-'}
                                </td>
                                <td className="p-3 text-sm text-gray-600">{log.remarks || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StaffAttendanceReport;
