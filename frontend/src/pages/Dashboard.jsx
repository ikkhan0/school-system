import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, MessageSquare, DollarSign, AlertCircle,
    Calendar, TrendingUp, BookOpen, UserCheck
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalClasses: 0,
        todayPresent: 0,
        todayAbsent: 0,
        feeDefaulters: 0,
        totalFeeOutstanding: 0,
        upcomingExams: 0,
        attendanceRate: 0,
        totalStaff: 0,
        staffPresent: 0,
        staffAbsent: 0
    });
    const [chartData, setChartData] = useState({
        feeCollection: [],
        attendance: [],
        performance: [],
        enrollment: []
    });
    const [absentStudents, setAbsentStudents] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (!user) return;
        fetchDashboardStats();
        fetchChartData();
        fetchAbsentStudents();
    }, [user]);

    const fetchDashboardStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/stats`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();

            // Calculate attendance rate
            const total = (data.todayPresent || 0) + (data.todayAbsent || 0);
            const rate = total > 0 ? ((data.todayPresent / total) * 100).toFixed(1) : 0;

            setStats({
                ...data,
                attendanceRate: parseFloat(rate)
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    const fetchChartData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/charts`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setChartData(data);
        } catch (error) {
            console.error('Error fetching chart data:', error);
        }
    };

    const fetchAbsentStudents = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/absent-today`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setAbsentStudents(data);
        } catch (error) {
            console.error('Error fetching absent students:', error);
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

    const statCards = [
        {
            title: 'Total Students',
            value: stats.totalStudents,
            icon: Users,
            color: 'green',
            gradient: 'from-emerald-500 to-emerald-600',
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-700',
            path: '/students'
        },
        {
            title: 'Total Staff',
            value: stats.totalStaff,
            subtitle: `${stats.staffPresent} Present Today`,
            icon: UserCheck,
            color: 'indigo',
            gradient: 'from-indigo-500 to-indigo-600',
            bgLight: 'bg-indigo-50',
            textColor: 'text-indigo-700',
            path: '/staff'
        },
        {
            title: 'Today\'s Attendance',
            value: `${stats.attendanceRate}%`,
            subtitle: `${stats.todayPresent} Present`,
            icon: UserCheck,
            color: 'teal',
            gradient: 'from-teal-500 to-teal-600',
            bgLight: 'bg-teal-50',
            textColor: 'text-teal-700',
            path: '/evaluation'
        },
        {
            title: 'Fee Outstanding',
            value: `Rs ${stats.totalFeeOutstanding?.toLocaleString() || 0}`,
            subtitle: `${stats.feeDefaulters} Defaulters`,
            icon: DollarSign,
            color: 'orange',
            gradient: 'from-orange-500 to-orange-600',
            bgLight: 'bg-orange-50',
            textColor: 'text-orange-700',
            path: '/reports'
        },
        {
            title: 'Students with Dues',
            value: stats.feeDefaulters,
            icon: AlertCircle,
            color: 'red',
            gradient: 'from-red-500 to-red-600',
            bgLight: 'bg-red-50',
            textColor: 'text-red-700',
            path: '/reports'
        },
        {
            title: 'Total Classes',
            value: stats.totalClasses,
            icon: BookOpen,
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            bgLight: 'bg-purple-50',
            textColor: 'text-purple-700',
            path: '/classes'
        },
        {
            title: 'Upcoming Exams',
            value: stats.upcomingExams || 0,
            icon: Calendar,
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-700',
            path: '/exam-menu'
        }
    ];

    const quickActions = [
        { title: 'Mark Attendance', path: '/evaluation', icon: UserCheck, color: 'teal' },
        { title: 'Collect Fees', path: '/fees', icon: DollarSign, color: 'green' },
        { title: 'Enter Marks', path: '/marks', icon: BookOpen, color: 'purple' },
        { title: 'View Reports', path: '/reports', icon: TrendingUp, color: 'blue' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                    Welcome back, {user?.full_name || user?.username || 'Admin'}! 👋
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Here's what's happening with your school today.</p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        onClick={() => navigate(card.path)}
                        className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    >
                        <div className={`bg-gradient-to-br ${card.gradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden`}>
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 opacity-10">
                                <card.icon size={100} className="sm:w-[120px] sm:h-[120px]" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg backdrop-blur-sm">
                                        <card.icon size={24} className="sm:w-7 sm:h-7" />
                                    </div>
                                    <TrendingUp size={18} className="opacity-70 sm:w-5 sm:h-5" />
                                </div>

                                <div className="mb-2">
                                    <p className="text-white text-opacity-90 text-xs sm:text-sm font-medium mb-1">
                                        {card.title}
                                    </p>
                                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                                        {card.value}
                                    </p>
                                    {card.subtitle && (
                                        <p className="text-white text-opacity-80 text-xs sm:text-sm mt-1">
                                            {card.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white opacity-0 group-hover:opacity-30 transition-opacity"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-600 sm:w-6 sm:h-6" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(action.path)}
                            className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-${action.color}-500 hover:bg-${action.color}-50 transition-all duration-200 group`}
                        >
                            <action.icon size={28} className={`sm:w-8 sm:h-8 text-${action.color}-600 mb-2 sm:mb-3 mx-auto group-hover:scale-110 transition-transform`} />
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                                {action.title}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Fee Collection Chart */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign size={20} className="text-green-600" />
                        Fee Collection (Last 6 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData.feeCollection}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                            <YAxis style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} name="Collected" />
                            <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2} name="Pending" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Attendance Chart */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600" />
                        Attendance Rate (Last 4 Weeks)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData.attendance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" style={{ fontSize: '12px' }} />
                            <YAxis style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="rate" fill="#3b82f6" name="Attendance %" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Performance Chart */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-purple-600" />
                        Grade Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={chartData.performance}
                                dataKey="count"
                                nameKey="grade"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {chartData.performance.map((entry, index) => {
                                    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                })}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Enrollment Chart */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-indigo-600" />
                        New Admissions (Last 6 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData.enrollment}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                            <YAxis style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#818cf8" name="Admissions" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Today's Summary */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Today's Summary</h3>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="bg-green-500 p-2 rounded-lg">
                                    <UserCheck size={18} className="text-white sm:w-5 sm:h-5" />
                                </div>
                                <span className="text-sm sm:text-base font-medium text-gray-700">Present</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-green-600">{stats.todayPresent}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="bg-red-500 p-2 rounded-lg">
                                    <AlertCircle size={18} className="text-white sm:w-5 sm:h-5" />
                                </div>
                                <span className="text-sm sm:text-base font-medium text-gray-700">Absent</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-red-600">{stats.todayAbsent}</span>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">System Information</h3>
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-white text-opacity-90">School Name</span>
                            <span className="text-sm sm:text-base font-semibold">{user?.school_name || 'School'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-white text-opacity-90">Total Students</span>
                            <span className="text-sm sm:text-base font-semibold">{stats.totalStudents}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-white text-opacity-90">Total Classes</span>
                            <span className="text-sm sm:text-base font-semibold">{stats.totalClasses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-white text-opacity-90">Attendance Rate</span>
                            <span className="text-sm sm:text-base font-semibold">{stats.attendanceRate}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Absent Students */}
            {absentStudents.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mt-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <AlertCircle className="text-red-600" size={20} />
                        Today's Absent Students ({absentStudents.length})
                    </h3>
                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                        {absentStudents.map((student, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg hover:bg-red-100 transition">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <span className="font-mono text-xs sm:text-sm bg-red-200 px-2 py-1 rounded">
                                            {student.roll_no}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-sm sm:text-base text-gray-800">{student.full_name}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">
                                                {student.class_id}-{student.section_id} • {student.father_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => sendWhatsApp(
                                        student.father_mobile,
                                        `Dear ${student.father_name}, your child ${student.full_name} (${student.roll_no}) is absent today. Please ensure regular attendance. - School Admin`
                                    )}
                                    className="bg-green-500 hover:bg-green-600 text-white p-2 sm:p-3 rounded-lg transition flex items-center gap-2"
                                    title="Send WhatsApp Message"
                                >
                                    <MessageSquare size={18} />
                                    <span className="hidden sm:inline text-sm">WhatsApp</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
