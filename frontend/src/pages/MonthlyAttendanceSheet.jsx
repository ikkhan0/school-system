import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Calendar, Printer, Filter, Download } from 'lucide-react';
import API_URL from '../config';

const MonthlyAttendanceSheet = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);
    const [classes, setClasses] = useState([]);
    const [filters, setFilters] = useState({
        class_id: '',
        section_id: '',
        month: new Date().toISOString().slice(0, 7) // YYYY-MM format
    });
    const [daysInMonth, setDaysInMonth] = useState([]);

    useEffect(() => {
        if (user) {
            fetchClasses();
        }
    }, [user]);

    useEffect(() => {
        if (user && filters.class_id && filters.section_id && filters.month) {
            fetchAttendance();
        }
        calculateDaysInMonth();
    }, [user, filters]);

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

    const calculateDaysInMonth = () => {
        if (!filters.month) return;
        const [year, month] = filters.month.split('-');
        const daysCount = new Date(year, parseInt(month), 0).getDate();
        const days = [];

        for (let i = 1; i <= daysCount; i++) {
            const date = new Date(year, parseInt(month) - 1, i);
            const dayOfWeek = date.getDay();
            days.push({
                date: i,
                dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
                isWeekend: dayOfWeek === 0, // Sunday
                fullDate: date
            });
        }
        setDaysInMonth(days);
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const [year, month] = filters.month.split('-');
            const startDate = new Date(year, parseInt(month) - 1, 1);
            const endDate = new Date(year, parseInt(month), 0);

            const params = new URLSearchParams({
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                class_id: filters.class_id,
                section_id: filters.section_id
            });

            const res = await axios.get(`${API_URL}/api/reports/attendance-detailed?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Group attendance by student
            const studentMap = new Map();

            res.data.logs.forEach(log => {
                const studentKey = log.student_id;
                if (!studentMap.has(studentKey)) {
                    studentMap.set(studentKey, {
                        student_id: log.student_id,
                        roll_no: log.roll_no,
                        name: log.name,
                        class_id: log.class_id,
                        section_id: log.section_id,
                        attendance: {}
                    });
                }

                const day = new Date(log.date).getDate();
                studentMap.get(studentKey).attendance[day] = log.status;
            });

            setAttendanceData(Array.from(studentMap.values()).sort((a, b) =>
                a.roll_no.localeCompare(b.roll_no, undefined, { numeric: true })
            ));
        } catch (error) {
            console.error('Error fetching attendance:', error);
            alert('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusDisplay = (status, isWeekend) => {
        if (isWeekend) {
            return { text: 'Off', color: 'bg-gray-200 text-gray-600' };
        }

        if (!status) {
            return { text: '-', color: 'bg-gray-50 text-gray-400' };
        }

        switch (status) {
            case 'Present':
                return { text: 'P', color: 'bg-green-100 text-green-700 font-bold' };
            case 'Absent':
                return { text: 'A', color: 'bg-red-100 text-red-700 font-bold' };
            case 'Leave':
                return { text: 'L', color: 'bg-blue-100 text-blue-700 font-bold' };
            case 'Late':
                return { text: 'Late', color: 'bg-yellow-100 text-yellow-700 font-bold' };
            default:
                return { text: status.charAt(0), color: 'bg-gray-100 text-gray-700' };
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getMonthName = () => {
        if (!filters.month) return '';
        const [year, month] = filters.month.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="max-w-full mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <Calendar className="text-blue-600" />
                                Monthly Attendance Sheet
                            </h1>
                            <p className="text-gray-600 mt-1">Calendar-style attendance report</p>
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

                {/* Filters */}
                <div className="no-print p-6 border-b bg-gray-50">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Filter size={18} />
                        Filters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Class *</label>
                            <select
                                value={filters.class_id}
                                onChange={(e) => setFilters({ ...filters, class_id: e.target.value, section_id: '' })}
                                className="w-full p-2 border rounded-lg"
                                required
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls._id} value={cls.name}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Section *</label>
                            <select
                                value={filters.section_id}
                                onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                                required
                                disabled={!filters.class_id}
                            >
                                <option value="">Select Section</option>
                                {filters.class_id && classes.find(c => c.name === filters.class_id)?.sections.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Month *</label>
                            <input
                                type="month"
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Report Title */}
                {filters.class_id && filters.section_id && filters.month && (
                    <div className="p-4 bg-blue-50 border-b print:bg-white">
                        <h2 className="text-xl font-bold text-center">
                            Attendance Sheet - Class {filters.class_id}-{filters.section_id} - {getMonthName()}
                        </h2>
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading attendance sheet...</p>
                        </div>
                    ) : !filters.class_id || !filters.section_id ? (
                        <div className="text-center py-12">
                            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">Please select Class, Section, and Month</p>
                        </div>
                    ) : attendanceData.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No students found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 p-2 sticky left-0 bg-gray-100 z-10 min-w-[150px]">
                                            Name
                                        </th>
                                        {daysInMonth.map(day => (
                                            <th
                                                key={day.date}
                                                className={`border border-gray-300 p-1 text-center min-w-[35px] ${day.isWeekend ? 'bg-gray-200' : ''
                                                    }`}
                                            >
                                                <div className="text-xs font-bold">{day.date}</div>
                                                <div className="text-xs text-gray-500">{day.dayName}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.map((student, idx) => (
                                        <tr key={student.student_id} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 p-2 sticky left-0 bg-white z-10 font-semibold">
                                                <div className="text-xs text-gray-500">{student.roll_no}</div>
                                                <div>{student.name}</div>
                                            </td>
                                            {daysInMonth.map(day => {
                                                const status = student.attendance[day.date];
                                                const display = getStatusDisplay(status, day.isWeekend);

                                                return (
                                                    <td
                                                        key={day.date}
                                                        className={`border border-gray-300 p-1 text-center ${display.color}`}
                                                    >
                                                        <span className="text-xs">{display.text}</span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Legend */}
                {attendanceData.length > 0 && (
                    <div className="p-4 border-t bg-gray-50">
                        <h4 className="font-bold mb-2">Legend:</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded bg-green-100 text-green-700 font-bold">P</span>
                                <span>Present</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded bg-red-100 text-red-700 font-bold">A</span>
                                <span>Absent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-bold">L</span>
                                <span>Leave</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-700 font-bold">Late</span>
                                <span>Late</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded bg-gray-200 text-gray-600">Off</span>
                                <span>Sunday/Holiday</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded bg-gray-50 text-gray-400">-</span>
                                <span>No Record</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    table {
                        font-size: 10px;
                    }
                    th, td {
                        padding: 2px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default MonthlyAttendanceSheet;
