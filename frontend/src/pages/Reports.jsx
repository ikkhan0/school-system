import { useState, useEffect, useContext } from 'react';
import { FileText, AlertTriangle, DollarSign, MessageCircle, Calendar, TrendingUp, User, Download, Printer, Filter } from 'lucide-react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import SettingsContext from '../context/SettingsContext';
import { formatDate } from '../utils/dateFormatter';
import API_URL from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Reports = () => {
    const { user } = useContext(AuthContext);
    const { dateFormat } = useContext(SettingsContext);
    const [activeTab, setActiveTab] = useState('defaulters');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [consecutiveAbsences, setConsecutiveAbsences] = useState([]);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        class_id: '',
        section_id: '',
        exam_id: ''
    });
    const [classes, setClasses] = useState([]);
    const [exams, setExams] = useState([]);

    useEffect(() => {
        if (user) {
            fetchClasses();
            fetchExams();
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, activeTab, filters]);

    useEffect(() => {
        if (user && activeTab === 'attendance') {
            fetchConsecutiveAbsences();
        }
    }, [user, activeTab]);

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const result = await res.json();
            setClasses(result);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchExams = async () => {
        try {
            const res = await fetch(`${API_URL}/api/exams`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const result = await res.json();
            setExams(result);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            let queryParams = new URLSearchParams();

            switch (activeTab) {
                case 'defaulters':
                    endpoint = '/api/reports/fee-defaulters';
                    if (filters.class_id) queryParams.append('class_id', filters.class_id);
                    break;
                case 'shortage':
                    endpoint = '/api/reports/shortage';
                    break;
                case 'attendance':
                    endpoint = '/api/reports/attendance-summary';
                    if (filters.start_date) queryParams.append('start_date', filters.start_date);
                    if (filters.end_date) queryParams.append('end_date', filters.end_date);
                    if (filters.class_id) queryParams.append('class_id', filters.class_id);
                    if (filters.section_id) queryParams.append('section_id', filters.section_id);
                    console.log('📊 Fetching attendance with params:', {
                        start_date: filters.start_date,
                        end_date: filters.end_date,
                        class_id: filters.class_id,
                        section_id: filters.section_id
                    });
                    break;
                case 'performance':
                    if (!filters.exam_id) {
                        setLoading(false);
                        return;
                    }
                    endpoint = '/api/reports/class-performance';
                    queryParams.append('exam_id', filters.exam_id);
                    if (filters.class_id) queryParams.append('class_id', filters.class_id);
                    break;
                case 'collection':
                    endpoint = '/api/reports/daily-collection';
                    if (filters.start_date) queryParams.append('date', filters.start_date);
                    break;
                default:
                    endpoint = '/api/reports/defaulters';
            }

            const url = `${API_URL}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            console.log('🔍 Fetching from:', url);
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const result = await res.json();
            console.log('✅ Data received:', result);
            setData(result);
        } catch (error) {
            console.error('❌ Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConsecutiveAbsences = async () => {
        try {
            const res = await fetch(`${API_URL}/api/reports/consecutive-absences`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const result = await res.json();
            setConsecutiveAbsences(result.students || []);
        } catch (error) {
            console.error('Error fetching consecutive absences:', error);
        }
    };

    const sendWhatsApp = (mobile, message) => {
        if (!mobile) return alert("Mobile Number not found!");
        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) {
            num = '92' + num.substring(1);
        }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    const tabs = [
        { id: 'defaulters', label: 'Fee Defaulters', icon: DollarSign, color: 'text-red-600' },
        { id: 'shortage', label: 'Attendance Shortage', icon: AlertTriangle, color: 'text-orange-600' },
        { id: 'attendance', label: 'Attendance Summary', icon: Calendar, color: 'text-blue-600' },
        { id: 'performance', label: 'Class Performance', icon: TrendingUp, color: 'text-green-600' },
        { id: 'collection', label: 'Daily Collection', icon: DollarSign, color: 'text-purple-600' }
    ];

    return (
        <div className="container-responsive py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0 flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    School Reports
                </h1>
                <button
                    onClick={handlePrint}
                    className="no-print bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
                >
                    <Printer size={18} />
                    Print Report
                </button>
            </div>

            {/* Tabs - Mobile Responsive */}
            <div className="no-print mb-6 overflow-x-auto">
                <div className="flex gap-2 md:gap-4 border-b min-w-max md:min-w-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-3 md:px-4 font-semibold flex items-center gap-2 text-sm md:text-base whitespace-nowrap transition ${activeTab === tab.id
                                ? `border-b-2 ${tab.color} border-current`
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters - Conditional based on active tab */}
            <div className="no-print card mb-6">
                <div className="card-header">
                    <h3 className="font-bold flex items-center gap-2">
                        <Filter size={18} />
                        Filters
                    </h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(activeTab === 'attendance' || activeTab === 'collection') && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={filters.start_date}
                                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                {activeTab === 'attendance' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={filters.end_date}
                                            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                            className="w-full border rounded-lg p-2"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {(activeTab === 'defaulters' || activeTab === 'attendance' || activeTab === 'performance') && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Class</label>
                                <select
                                    value={filters.class_id}
                                    onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(cls => (
                                        <option key={cls._id} value={cls.name}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {activeTab === 'attendance' && filters.class_id && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Section</label>
                                <select
                                    value={filters.section_id}
                                    onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="">All Sections</option>
                                    {classes.find(c => c.name === filters.class_id)?.sections.map(sec => (
                                        <option key={sec} value={sec}>{sec}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {activeTab === 'performance' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Exam *</label>
                                <select
                                    value={filters.exam_id}
                                    onChange={(e) => setFilters({ ...filters, exam_id: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="">Select Exam</option>
                                    {exams.map(exam => (
                                        <option key={exam._id} value={exam._id}>{exam.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="card">
                {loading ? (
                    <LoadingSpinner text="Loading report..." />
                ) : (
                    <div className="card-body p-0">
                        {activeTab === 'defaulters' && <DefaultersReport data={data} sendWhatsApp={sendWhatsApp} />}
                        {activeTab === 'shortage' && <ShortageReport data={data} sendWhatsApp={sendWhatsApp} />}
                        {activeTab === 'attendance' && <AttendanceReport data={data} sendWhatsApp={sendWhatsApp} consecutiveAbsences={consecutiveAbsences} />}
                        {activeTab === 'performance' && <PerformanceReport data={data} />}
                        {activeTab === 'collection' && <CollectionReport data={data} dateFormat={dateFormat} />}
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-components for each report type
const DefaultersReport = ({ data, sendWhatsApp }) => {
    if (!data.defaulters || data.defaulters.length === 0) {
        return <EmptyState type="fees" title="No defaulters" description="All students have cleared their fees!" />;
    }

    return (
        <div>
            <div className="p-4 bg-red-50 border-b">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Defaulters</p>
                        <p className="text-2xl font-bold text-red-600">{data.total_defaulters}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total Amount Due</p>
                        <p className="text-2xl font-bold text-red-600">Rs. {data.total_amount_due.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div className="table-responsive">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">Roll No</th>
                            <th className="p-3 text-left">Student</th>
                            <th className="p-3 text-left">Class</th>
                            <th className="p-3 text-right">Total Due</th>
                            <th className="p-3 text-center">Months</th>
                            <th className="p-3 text-center no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.defaulters.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="p-3 font-mono text-sm">{item.roll_no}</td>
                                <td className="p-3">
                                    <div className="font-semibold">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.father_mobile}</div>
                                </td>
                                <td className="p-3">{item.class_id}-{item.section_id}</td>
                                <td className="p-3 text-right font-bold text-red-600">Rs. {item.total_due.toLocaleString()}</td>
                                <td className="p-3 text-center">{item.pending_months}</td>
                                <td className="p-3 text-center no-print">
                                    {/* WhatsApp priority: father_mobile → mother_mobile (fallback) */}
                                    <button
                                        onClick={() => sendWhatsApp(item.father_mobile || item.mother_mobile, `Dear Parent, please clear the outstanding dues of Rs. ${item.total_due} for ${item.name}. - School Admin`)}
                                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg"
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

const ShortageReport = ({ data, sendWhatsApp }) => {
    // Add better error handling
    if (!data) {
        return <EmptyState type="attendance" title="Loading..." description="Please wait while we load the data." />;
    }

    if (!Array.isArray(data) || data.length === 0) {
        return <EmptyState type="attendance" title="No shortage" description="All students have good attendance!" />;
    }

    return (
        <div className="table-responsive">
            <table className="w-full">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 text-left">Roll No</th>
                        <th className="p-3 text-left">Student</th>
                        <th className="p-3 text-left">Class</th>
                        <th className="p-3 text-right">Attendance %</th>
                        <th className="p-3 text-center">Present/Total</th>
                        <th className="p-3 text-center no-print">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {data.map((item, idx) => {
                        // Safely access nested properties
                        const student = item.student || {};
                        const rollNo = student.roll_no || 'N/A';
                        const fullName = student.full_name || 'Unknown';
                        const classId = student.class_id || '';
                        const sectionId = student.section_id || '';
                        const fatherName = item.father_name || 'N/A';
                        const fatherMobile = item.father_mobile || '';
                        const percentage = item.percentage || '0';
                        const present = item.present || 0;
                        const totalDays = item.totalDays || 0;

                        return (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="p-3 font-mono text-sm">{rollNo}</td>
                                <td className="p-3">
                                    <div className="font-semibold">{fullName}</div>
                                    <div className="text-xs text-gray-500">{fatherName}</div>
                                </td>
                                <td className="p-3">{classId}{sectionId ? `-${sectionId}` : ''}</td>
                                <td className="p-3 text-right font-bold text-orange-600">{percentage}%</td>
                                <td className="p-3 text-center">{present}/{totalDays}</td>
                                <td className="p-3 text-center no-print">
                                    {(fatherMobile || item.mother_mobile) && (
                                        <button
                                            onClick={() => sendWhatsApp(fatherMobile || item.mother_mobile, `Dear Parent, ${fullName} has low attendance (${percentage}%). Please ensure regularity. - School Admin`)}
                                            className="text-green-600 hover:bg-green-50 p-2 rounded-lg"
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


const AttendanceReport = ({ data, sendWhatsApp, consecutiveAbsences = [] }) => {
    console.log('📊 AttendanceReport data:', data);

    if (!data || !data.report || data.report.length === 0) {
        return <EmptyState type="attendance" title="No data" description="No attendance records found for the selected period." />;
    }

    const isConsecutiveAbsent = (studentId) => {
        return consecutiveAbsences.find(s => s.student_id.toString() === studentId.toString());
    };

    // Safe date formatting
    const formatDateSafe = (dateStr) => {
        try {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            return date.toLocaleDateString();
        } catch (e) {
            return 'N/A';
        }
    };

    return (
        <div>
            <div className="p-4 bg-blue-50 border-b">
                <p className="text-sm text-gray-600">Total Students: <span className="font-bold">{data.total_students || 0}</span></p>
                <p className="text-xs text-gray-500">
                    Period: {formatDateSafe(data.start_date)} - {formatDateSafe(data.end_date)}
                </p>
                {consecutiveAbsences.length > 0 && (
                    <p className="text-sm text-red-600 font-semibold mt-2">
                        ⚠️ {consecutiveAbsences.length} student(s) with 3+ consecutive absences
                    </p>
                )}
            </div>
            <div className="table-responsive">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">Roll No</th>
                            <th className="p-3 text-left">Student</th>
                            <th className="p-3 text-left">Class</th>
                            <th className="p-3 text-left">Mobile</th>
                            <th className="p-3 text-center">Present</th>
                            <th className="p-3 text-center">Absent</th>
                            <th className="p-3 text-center">Leave</th>
                            <th className="p-3 text-right">Percentage</th>
                            <th className="p-3 text-center no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.report.map((item, idx) => {
                            const consecutiveInfo = isConsecutiveAbsent(item.student_id);
                            return (
                                <tr key={idx} className={`hover:bg-gray-50 ${consecutiveInfo ? 'bg-red-50' : ''}`}>
                                    <td className="p-3 font-mono text-sm">{item.roll_no}</td>
                                    <td className="p-3">
                                        <div className="font-semibold flex items-center gap-2">
                                            {item.name}
                                            {consecutiveInfo && (
                                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded" title={`${consecutiveInfo.consecutive_days} consecutive absences`}>
                                                    {consecutiveInfo.consecutive_days}d
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">{item.father_name}</div>
                                    </td>
                                    <td className="p-3">{item.class_id}-{item.section_id}</td>
                                    <td className="p-3 text-sm">{item.father_mobile || '-'}</td>
                                    <td className="p-3 text-center text-green-600 font-semibold">{item.present}</td>
                                    <td className="p-3 text-center text-red-600 font-semibold">{item.absent}</td>
                                    <td className="p-3 text-center text-yellow-600 font-semibold">{item.leave}</td>
                                    <td className={`p-3 text-right font-bold ${item.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.percentage}%
                                    </td>
                                    <td className="p-3 text-center no-print">
                                        <button
                                            onClick={() => {
                                                const message = consecutiveInfo
                                                    ? `Dear ${item.father_name || 'Parent'}, ${item.name} has been absent for ${consecutiveInfo.consecutive_days} consecutive days. Current attendance: ${item.percentage}%. Please ensure regular attendance. - School Admin`
                                                    : `Dear ${item.father_name || 'Parent'}, Attendance Summary for ${item.name} (${item.roll_no}):\nPresent: ${item.present}\nAbsent: ${item.absent}\nLeave: ${item.leave}\nAttendance: ${item.percentage}%\n- School Admin`;
                                                sendWhatsApp(item.father_mobile || item.mother_mobile, message);
                                            }}
                                            className="text-green-600 hover:bg-green-50 p-2 rounded-lg"
                                            title="Send WhatsApp"
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PerformanceReport = ({ data }) => {
    if (!data.exam_title) {
        return <EmptyState type="default" title="Select an exam" description="Please select an exam from the filters above." />;
    }

    if (data.total_students === 0) {
        return <EmptyState type="default" title="No results" description="No exam results found for the selected exam." />;
    }

    return (
        <div>
            <div className="p-4 bg-green-50 border-b">
                <h3 className="font-bold text-lg mb-2">{data.exam_title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Students</p>
                        <p className="text-xl font-bold">{data.total_students}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Passed</p>
                        <p className="text-xl font-bold text-green-600">{data.passed}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Failed</p>
                        <p className="text-xl font-bold text-red-600">{data.failed}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Pass %</p>
                        <p className="text-xl font-bold text-blue-600">{data.pass_percentage}%</p>
                    </div>
                </div>
            </div>

            {data.top_performers && data.top_performers.length > 0 && (
                <div className="p-4 border-b">
                    <h4 className="font-bold mb-3">Top Performers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.top_performers.map((student, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <div>
                                    <span className="font-bold text-lg mr-2">#{idx + 1}</span>
                                    <span className="font-semibold">{student.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">({student.roll_no})</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-green-600">{student.percentage}%</div>
                                    <div className="text-xs text-gray-600">Grade: {student.grade}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.needs_attention && data.needs_attention.length > 0 && (
                <div className="p-4">
                    <h4 className="font-bold mb-3 text-red-600">Students Needing Attention (Below 50%)</h4>
                    <div className="space-y-2">
                        {data.needs_attention.map((student, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div>
                                    <span className="font-semibold">{student.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">({student.roll_no}) - {student.class_id}</span>
                                </div>
                                <div className="font-bold text-red-600">{student.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CollectionReport = ({ data, dateFormat }) => {
    if (!data.breakdown || data.breakdown.length === 0) {
        return <EmptyState type="fees" title="No collections" description="No fee collections found for the selected date." />;
    }

    return (
        <div>
            <div className="p-4 bg-purple-50 border-b">
                <p className="text-sm text-gray-600 mb-2">Date: {formatDate(data.date, dateFormat)}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Collection</p>
                        <p className="text-2xl font-bold text-purple-600">Rs. {data.total_collection.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total Transactions</p>
                        <p className="text-2xl font-bold text-purple-600">{data.total_transactions}</p>
                    </div>
                </div>
            </div>
            <div className="table-responsive">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">Student</th>
                            <th className="p-3 text-left">Class</th>
                            <th className="p-3 text-left">Month</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.breakdown.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="p-3">
                                    <div className="font-semibold">{item.student_name}</div>
                                    <div className="text-xs text-gray-500">{item.roll_no}</div>
                                </td>
                                <td className="p-3">{item.class_id}</td>
                                <td className="p-3">{item.month}</td>
                                <td className="p-3 text-right font-bold text-green-600">Rs. {item.amount.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
