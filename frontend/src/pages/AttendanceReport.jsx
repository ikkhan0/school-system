import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Calendar, MessageCircle, Download, Printer, Filter, Users, ChevronDown } from 'lucide-react';
import API_URL from '../config';

const AttendanceReport = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('summary'); // 'summary' or 'detailed'
    const [data, setData] = useState({ report: [], logs: [] });
    const [filters, setFilters] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        class_id: '',
        section_id: '',
        preset: 'today'
    });
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        if (user) {
            fetchClasses();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, view, filters.start_date, filters.end_date, filters.class_id, filters.section_id]);

    const fetchClasses = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setClasses(res.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = view === 'summary'
                ? '/api/reports/attendance-summary'
                : '/api/reports/attendance-detailed';

            const params = new URLSearchParams({
                start_date: filters.start_date,
                end_date: filters.end_date
            });

            if (filters.class_id) params.append('class_id', filters.class_id);
            if (filters.section_id) params.append('section_id', filters.section_id);

            const res = await axios.get(`${API_URL}${endpoint}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setData(res.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            alert('Failed to load attendance data');
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

    const sendWhatsApp = (mobile, message) => {
        if (!mobile) return alert("Mobile number not found!");
        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) {
            num = '92' + num.substring(1);
        }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleSendIndividualReport = (student) => {
        const message = view === 'summary'
            ? `Dear ${student.father_name || 'Parent'},\n\nAttendance Report for ${student.name}\nRoll No: ${student.roll_no}\nClass: ${student.class_id}-${student.section_id}\n\nPeriod: ${filters.start_date} to ${filters.end_date}\n\nPresent: ${student.present} days\nAbsent: ${student.absent} days\nLeave: ${student.leave} days\n\nAttendance: ${student.percentage}%\n\n- School Management`
            : `Dear Parent,\n\nDaily attendance update for ${student.name} on ${new Date(student.date).toLocaleDateString()}:\nStatus: ${student.status}\n\n- School Management`;

        sendWhatsApp(student.father_mobile, message);
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
                                <Calendar className="text-blue-600" />
                                Student Attendance Reports
                            </h1>
                            <p className="text-gray-600 mt-1">Comprehensive attendance tracking and reporting</p>
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
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Summary View
                        </button>
                        <button
                            onClick={() => setView('detailed')}
                            className={`px-4 py-2 rounded-lg font-semibold ${view === 'detailed'
                                    ? 'bg-blue-600 text-white'
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
                                            ? 'bg-blue-600 text-white'
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
                            <label className="block text-sm font-semibold mb-1">Class</label>
                            <select
                                value={filters.class_id}
                                onChange={(e) => setFilters({ ...filters, class_id: e.target.value, section_id: '' })}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls._id} value={cls.name}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        {filters.class_id && (
                            <div>
                                <label className="block text-sm font-semibold mb-1">Section</label>
                                <select
                                    value={filters.section_id}
                                    onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="">All Sections</option>
                                    {classes.find(c => c.name === filters.class_id)?.sections.map(sec => (
                                        <option key={sec} value={sec}>{sec}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading attendance data...</p>
                        </div>
                    ) : view === 'summary' ? (
                        <SummaryView data={data} onSendWhatsApp={handleSendIndividualReport} />
                    ) : (
                        <DetailedView data={data} onSendWhatsApp={handleSendIndividualReport} />
                    )}
                </div>
            </div>
        </div>
    );
};

const SummaryView = ({ data, onSendWhatsApp }) => {
    if (!data.report || data.report.length === 0) {
        return (
            <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No attendance data found</p>
                <p className="text-gray-400">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Summary Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-blue-600">{data.total_students}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Avg Attendance</p>
                        <p className="text-2xl font-bold text-green-600">
                            {(data.report.reduce((sum, s) => sum + s.percentage, 0) / data.report.length).toFixed(1)}%
                        </p>
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
                            <th className="p-3 text-left border">Roll No</th>
                            <th className="p-3 text-left border">Student Name</th>
                            <th className="p-3 text-left border">Class</th>
                            <th className="p-3 text-center border">Present</th>
                            <th className="p-3 text-center border">Absent</th>
                            <th className="p-3 text-center border">Leave</th>
                            <th className="p-3 text-center border">Total</th>
                            <th className="p-3 text-right border">%</th>
                            <th className="p-3 text-center border no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.report.map((student, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 border">
                                <td className="p-3 font-mono text-sm">{student.roll_no}</td>
                                <td className="p-3">
                                    <div className="font-semibold">{student.name}</div>
                                    <div className="text-xs text-gray-500">{student.father_name}</div>
                                </td>
                                <td className="p-3">{student.class_id}-{student.section_id}</td>
                                <td className="p-3 text-center text-green-600 font-bold">{student.present}</td>
                                <td className="p-3 text-center text-red-600 font-bold">{student.absent}</td>
                                <td className="p-3 text-center text-yellow-600 font-bold">{student.leave}</td>
                                <td className="p-3 text-center font-semibold">{student.total}</td>
                                <td className={`p-3 text-right font-bold ${student.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                    {student.percentage}%
                                </td>
                                <td className="p-3 text-center no-print">
                                    <button
                                        onClick={() => onSendWhatsApp(student)}
                                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg"
                                        title="Send via WhatsApp"
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DetailedView = ({ data, onSendWhatsApp }) => {
    if (!data.logs || data.logs.length === 0) {
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
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    Showing {data.total_records} attendance records from {new Date(data.start_date).toLocaleDateString()} to {new Date(data.end_date).toLocaleDateString()}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left border">Date</th>
                            <th className="p-3 text-left border">Roll No</th>
                            <th className="p-3 text-left border">Student</th>
                            <th className="p-3 text-left border">Class</th>
                            <th className="p-3 text-center border">Status</th>
                            <th className="p-3 text-left border">Remarks</th>
                            <th className="p-3 text-center border no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.logs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 border">
                                <td className="p-3">{new Date(log.date).toLocaleDateString()}</td>
                                <td className="p-3 font-mono text-sm">{log.roll_no}</td>
                                <td className="p-3">
                                    <div className="font-semibold">{log.name}</div>
                                    <div className="text-xs text-gray-500">{log.father_mobile}</div>
                                </td>
                                <td className="p-3">{log.class_id}-{log.section_id}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.status === 'Present' ? 'bg-green-100 text-green-700' :
                                            log.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-600">{log.remarks || '-'}</td>
                                <td className="p-3 text-center no-print">
                                    <button
                                        onClick={() => onSendWhatsApp(log)}
                                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg"
                                        title="Send via WhatsApp"
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceReport;
