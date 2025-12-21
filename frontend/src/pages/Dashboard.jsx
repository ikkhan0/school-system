import { useState, useEffect, useContext } from 'react';
import { Users, CheckCircle, DollarSign, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import AuthContext from '../context/AuthContext';

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

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

            {loading && <div className="text-center text-blue-600 font-semibold">Loading dashboard...</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Users size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500">Total Students</p>
                        <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full text-green-600"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500">Today's Attendance</p>
                        <p className="text-2xl font-bold">{stats.attendancePercentage}%</p>
                        <p className="text-xs text-gray-400">{stats.presentCount} P / {stats.absentCount} A</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500 flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full text-yellow-600"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500">Monthly Confirmed</p>
                        <p className="text-2xl font-bold">Rs. {stats.monthlyCollection}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Absents */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Today's Absents
                    </h2>
                    {absents.length === 0 ? (
                        <p className="text-gray-500">No absents today.</p>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {absents.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p className="font-bold">{s.student_name}</p>
                                        <p className="text-xs text-gray-500">{s.class_id}-{s.section_id} | Roll: {s.roll_no}</p>
                                    </div>
                                    <button
                                        onClick={() => sendWhatsApp(s.father_mobile, `Dear Parent, ${s.student_name} is absent today. Please ensure regular attendance. - Bismillah Educational Complex`)}
                                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                    >
                                        WhatsApp
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Warnings (3-Day Consecutive) */}
                <div className="bg-white rounded-lg shadow p-6 border border-red-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
                        <AlertOctagon size={20} /> 3-Day Absent Warning
                    </h2>
                    {warnings.length === 0 ? (
                        <p className="text-gray-500">No critical alerts.</p>
                    ) : (
                        <div className="space-y-3">
                            {warnings.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-red-50 p-2 rounded">
                                    <div>
                                        <p className="font-bold">{s.full_name}</p>
                                        <p className="text-xs text-gray-600">Father: {s.father_name || 'N/A'}</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs font-bold text-red-600">CRITICAL</span>
                                        <button
                                            onClick={() => sendWhatsApp(s.family_id?.father_mobile, `Dear Parent, ${s.full_name} has been absent for 3 consecutive days. Please contact the school immediately. - Bismillah Educational Complex`)}
                                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                        >
                                            Notify
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 flex gap-4">
                <Link to="/bulk-slips" className="bg-gray-800 text-white px-6 py-3 rounded hover:bg-black">
                    Print Bulk Fee Slips
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
