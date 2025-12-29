import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FileSpreadsheet, FileText, Download, Filter, Users, DollarSign, Calendar, TrendingUp, UserCheck } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import SettingsContext from '../../context/SettingsContext';
import API_URL from '../../config';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from '../../utils/dateFormatter';

const AdvancedReports = () => {
    const { user } = useContext(AuthContext);
    const { dateFormat } = useContext(SettingsContext);
    const [activeTab, setActiveTab] = useState('students');
    const [reportType, setReportType] = useState('list');
    const [filters, setFilters] = useState({
        class_id: '',
        section_id: '',
        status: 'Active',
        start_date: '',
        end_date: '',
        month: new Date().toISOString().slice(0, 7)
    });
    const [data, setData] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFields, setSelectedFields] = useState(['roll_no', 'full_name', 'father_name', 'class_id']); // Defaults

    const availableFields = [
        { id: 'roll_no', label: 'Roll No' },
        { id: 'full_name', label: 'Name' },
        { id: 'father_name', label: 'Father Name' },
        { id: 'gender', label: 'Gender' },
        { id: 'dob', label: 'Date of Birth' },
        { id: 'class_id', label: 'Class' },
        { id: 'section_id', label: 'Section' },
        { id: 'father_mobile', label: 'Father Mobile' },
        { id: 'student_mobile', label: 'Student Mobile' },
        { id: 'address', label: 'Address' },
        { id: 'city', label: 'City' },
        { id: 'admission_date', label: 'Admission Date' },
        { id: 'blood_group', label: 'Blood Group' },
        { id: 'religion', label: 'Religion' },
        { id: 'cnic', label: 'B-Form/CNIC' },
        { id: 'father_cnic', label: 'Father CNIC' },
        { id: 'monthly_fee', label: 'Monthly Fee' },
        { id: 'status', label: 'Status' }
    ];

    useEffect(() => {
        if (user) {
            fetchClasses();
            fetchSessions();
        }
    }, [user]);

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

    const fetchSessions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/sessions`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const result = await res.json();
            setSessions(result);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            const params = new URLSearchParams();

            // Build endpoint based on active tab and report type
            if (activeTab === 'students') {
                endpoint = '/api/reports/students';
                if (filters.session_id) params.append('session_id', filters.session_id);
                if (filters.class_id) params.append('class_id', filters.class_id);
                if (filters.section_id) params.append('section_id', filters.section_id);
                if (filters.status) params.append('status', filters.status);
                params.append('type', reportType);
                if (reportType === 'custom') {
                    params.append('fields', selectedFields.join(','));
                }
            } else if (activeTab === 'fees') {
                endpoint = '/api/reports/fees';
                params.append('type', reportType);
                if (filters.start_date) params.append('start_date', filters.start_date);
                if (filters.end_date) params.append('end_date', filters.end_date);
                if (filters.class_id) params.append('class_id', filters.class_id);
                if (filters.month) params.append('month', filters.month);
            } else if (activeTab === 'attendance') {
                endpoint = '/api/reports/attendance';
                params.append('type', reportType);
                if (filters.start_date) params.append('start_date', filters.start_date);
                if (filters.end_date) params.append('end_date', filters.end_date);
                if (filters.class_id) params.append('class_id', filters.class_id);
                if (filters.section_id) params.append('section_id', filters.section_id);
            } else if (activeTab === 'exams') {
                endpoint = '/api/reports/exams';
                params.append('type', reportType);
                if (filters.class_id) params.append('class_id', filters.class_id);
            } else if (activeTab === 'staff') {
                endpoint = '/api/reports/staff';
                params.append('type', reportType);
                if (filters.start_date) params.append('start_date', filters.start_date);
                if (filters.end_date) params.append('end_date', filters.end_date);
            }

            const res = await fetch(`${API_URL}${endpoint}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error(error);
            alert('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${activeTab}_${reportType}_report.xlsx`);
    };

    const exportToPDF = () => {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`${activeTab.toUpperCase()} Report - ${reportType}`, 14, 20);
            doc.setFontSize(11);
            doc.text(`Generated: ${formatDate(new Date(), dateFormat)}`, 14, 28);

            // Get column headers from first data item
            const headers = Object.keys(data[0]);
            const rows = data.map(item => headers.map(key => item[key] !== null && item[key] !== undefined ? item[key].toString() : '-'));

            doc.autoTable({
                head: [headers],
                body: rows,
                startY: 35,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [66, 139, 202], textColor: 255 },
                margin: { top: 35 }
            });

            doc.save(`${activeTab}_${reportType}_report.pdf`);
        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    const tabs = [
        { id: 'students', label: 'Student Reports', icon: Users, color: 'blue' },
        { id: 'fees', label: 'Fee Reports', icon: DollarSign, color: 'green' },
        { id: 'attendance', label: 'Attendance Reports', icon: Calendar, color: 'purple' },
        { id: 'exams', label: 'Exam Reports', icon: TrendingUp, color: 'orange' },
        { id: 'staff', label: 'Staff Reports', icon: UserCheck, color: 'indigo' }
    ];

    const reportTypes = {
        students: [
            { value: 'list', label: 'Student List' },
            { value: 'classwise', label: 'Class-wise Report' },
            { value: 'custom', label: 'Custom Report' }
        ],
        fees: [
            { value: 'collection', label: 'Fee Collection' },
            { value: 'defaulters', label: 'Defaulters' },
            { value: 'monthly', label: 'Monthly Summary' }
        ],
        attendance: [
            { value: 'daily', label: 'Daily Attendance' },
            { value: 'monthly', label: 'Monthly Summary' },
            { value: 'low', label: 'Low Attendance' }
        ],
        exams: [
            { value: 'performance', label: 'Subject Performance' },
            { value: 'progress', label: 'Student Progress' }
        ],
        staff: [
            { value: 'list', label: 'Staff List' },
            { value: 'attendance', label: 'Staff Attendance' }
        ]
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Advanced Reports</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 sm:mb-6 border-b overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setReportType(reportTypes[tab.id][0].value);
                            setData([]);
                        }}
                        className={`pb-2 px-3 sm:px-4 font-semibold flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap ${activeTab === tab.id
                            ? `border-b-2 border-${tab.color}-600 text-${tab.color}-600`
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={16} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
                <h3 className="font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <Filter size={18} />
                    Report Filters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Report Type */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full border p-2 rounded text-sm"
                        >
                            {reportTypes[activeTab].map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Session Filter */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1">Session</label>
                        <select
                            value={filters.session_id}
                            onChange={(e) => setFilters({ ...filters, session_id: e.target.value })}
                            className="w-full border p-2 rounded text-sm"
                        >
                            <option value="">Current Session</option>
                            {sessions.map(s => (
                                <option key={s._id} value={s._id}>{s.session_name} {s.is_current ? '(Current)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Class Filter */}
                    {(activeTab === 'students' || activeTab === 'fees' || activeTab === 'attendance' || activeTab === 'exams') && (
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1">Class</label>
                            <select
                                value={filters.class_id}
                                onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                                className="w-full border p-2 rounded text-sm"
                            >
                                <option value="">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls._id} value={cls.name}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Section Filter */}
                    {(activeTab === 'students' || activeTab === 'attendance') && filters.class_id && (
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1">Section</label>
                            <select
                                value={filters.section_id}
                                onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
                                className="w-full border p-2 rounded text-sm"
                            >
                                <option value="">All Sections</option>
                                {classes.find(c => c.name === filters.class_id)?.sections.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date Filters */}
                    {(activeTab === 'fees' || activeTab === 'attendance' || activeTab === 'staff') && (
                        <>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                    className="w-full border p-2 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                    className="w-full border p-2 rounded text-sm"
                                />
                            </div>
                        </>
                    )}

                    {/* Status Filter for Students */}
                    {activeTab === 'students' && (
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full border p-2 rounded text-sm"
                            >
                                <option value="">All</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    )}

                    {/* Custom Field Selection */}
                    {activeTab === 'students' && reportType === 'custom' && (
                        <div className="col-span-1 sm:col-span-2 lg:col-span-4 border-t pt-4 mt-2">
                            <label className="block text-sm font-bold mb-2">Select Fields to Include</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {availableFields.map(field => (
                                    <label key={field.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedFields.includes(field.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedFields([...selectedFields, field.id]);
                                                } else {
                                                    setSelectedFields(selectedFields.filter(f => f !== field.id));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{field.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base"
                    >
                        {loading ? 'Loading...' : 'Generate Report'}
                    </button>
                    {data.length > 0 && (
                        <>
                            <button
                                onClick={exportToExcel}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <FileSpreadsheet size={16} />
                                Export Excel
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <FileText size={16} />
                                Export PDF
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Results */}
            {
                loading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading report...</p>
                    </div>
                )
            }

            {
                !loading && data.length > 0 && (
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-100">
                                <tr>
                                    {Object.keys(data[0]).map((key, index) => (
                                        <th key={index} className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">
                                            {key.replace(/_/g, ' ').toUpperCase()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        {Object.values(row).map((value, i) => (
                                            <td key={i} className="p-2 sm:p-3 text-xs sm:text-sm">
                                                {value !== null && value !== undefined ? value.toString() : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 sm:p-4 bg-gray-50 border-t">
                            <p className="text-xs sm:text-sm text-gray-600">
                                Total Records: <span className="font-bold">{data.length}</span>
                            </p>
                        </div>
                    </div>
                )
            }

            {
                !loading && data.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                        <p>No data available. Please select filters and click "Generate Report".</p>
                    </div>
                )
            }
        </div >
    );
};

export default AdvancedReports;
