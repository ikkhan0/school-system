import { useState, useEffect, useContext } from 'react';
import { Users, CheckCircle, DollarSign, AlertOctagon, TrendingUp, Calendar, Phone, MessageCircle, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import AuthContext from '../context/AuthContext';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalStudents: 0,
        attendancePercentage: 0,
        monthlyCollection: 0,
        presentCount: 0,
        absentCount: 0
    });
    const [absents, setAbsents] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;
        fetchStats();
        fetchAbsents();
        fetchWarnings();
    }, [user]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/stats`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(err.message);
        }
    };

    const fetchAbsents = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/absents`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch absents');
            const data = await res.json();
            setAbsents(data);
        } catch (err) {
            console.error('Error fetching absents:', err);
        }
    };

    const fetchWarnings = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/warnings`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch warnings');
            const data = await res.json();
            setWarnings(data);
        } catch (err) {
            console.error('Error fetching warnings:', err);
        } finally {
            setLoading(false);
        }
    };

    const sendWhatsApp = (mobile, message) => {
        if (!mobile) return alert("Parent Mobile Number not found!");
        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) {
            num = '92' + num.substring(1);
        }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const quickActions = [
        { label: 'Mark Attendance', icon: Calendar, link: '/evaluation', color: 'bg-blue-600' },
        { label: 'Collect Fees', icon: DollarSign, link: '/fee-collection', color: 'bg-green-600' },
        { label: 'Add Student', icon: Users, link: '/students', color: 'bg-purple-600' },
        { label: 'View Reports', icon: FileText, link: '/reports', color: 'bg-orange-600' }
    ];

    if (loading) {
        return (
            <div className="container-responsive py-8">
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </div>
        );
    }

    return (
        <div className="container-responsive py-4 md:py-6">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.full_name || user?.username}!
                </h1>
                <p className="text-gray-600">Here's what's happening in your school today.</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid-responsive mb-8">
                <StatCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={Users}
                    color="blue"
                    trend="up"
                    trendValue="+5 this month"
                />
                <StatCard
                    title="Today's Attendance"
                    value={`${stats.attendancePercentage}%`}
                    icon={CheckCircle}
                    color="green"
                    trend={stats.attendancePercentage >= 75 ? 'up' : 'down'}
                    trendValue={`${stats.presentCount}/${stats.presentCount + stats.absentCount} present`}
                />
                <StatCard
                    title="Monthly Collection"
                    value={`Rs. ${stats.monthlyCollection.toLocaleString()}`}
                    icon={DollarSign}
                    color="purple"
                    trend="up"
                    trendValue="+12% from last month"
                />
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            to={action.link}
                            className={`${action.color} text-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 flex flex-col items-center justify-center gap-2 md:gap-3 text-center`}
                        >
                            <action.icon className="w-6 h-6 md:w-8 md:h-8" />
                            <span className="text-xs md:text-sm font-semibold">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Two Column Layout for Absents and Warnings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Today's Absents */}
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <AlertOctagon className="text-red-600" size={20} />
                                Today's Absents ({absents.length})
                            </h2>
                            <Link to="/evaluation" className="text-sm text-blue-600 hover:underline">
                                Mark Attendance
                            </Link>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {absents.length === 0 ? (
                            <EmptyState
                                type="attendance"
                                title="No absents today"
                                description="All students are present. Great job!"
                            />
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                {absents.map((absent, index) => (
                                    <div key={index} className="p-4 hover:bg-gray-50 transition">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{absent.student_name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Roll No: {absent.roll_no} | Class: {absent.class_id} ({absent.section_id})
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    <Phone className="inline w-3 h-3 mr-1" />
                                                    {absent.father_mobile}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => sendWhatsApp(
                                                    absent.father_mobile,
                                                    `Dear Parent, your child ${absent.student_name} is absent today. Please ensure regular attendance. - School Admin`
                                                )}
                                                className="ml-3 p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                                                title="Send WhatsApp"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3-Day Warnings */}
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <AlertOctagon className="text-orange-600" size={20} />
                                Attendance Warnings ({warnings.length})
                            </h2>
                            <Link to="/reports" className="text-sm text-blue-600 hover:underline">
                                View Report
                            </Link>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Students absent for 3+ consecutive days</p>
                    </div>
                    <div className="card-body p-0">
                        {warnings.length === 0 ? (
                            <EmptyState
                                type="attendance"
                                title="No warnings"
                                description="No students with consecutive absences."
                            />
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                {warnings.map((student, index) => (
                                    <div key={index} className="p-4 hover:bg-gray-50 transition">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Roll No: {student.roll_no} | Class: {student.class_id} ({student.section_id})
                                                </p>
                                                <p className="text-xs text-red-600 font-medium mt-1">
                                                    ⚠️ Absent for 3+ days
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => sendWhatsApp(
                                                    student.family_id?.father_mobile || student.father_mobile,
                                                    `Dear Parent, ${student.full_name} has been absent for multiple days. Please contact the school immediately. - School Admin`
                                                )}
                                                className="ml-3 p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
                                                title="Send WhatsApp"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Action Button (Mobile Only) */}
            <Link to="/evaluation" className="fab lg:hidden">
                <Plus size={24} />
            </Link>
        </div>
    );
};

export default Dashboard;
