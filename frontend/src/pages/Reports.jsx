import { useState, useEffect, useContext } from 'react';
import { FileText, AlertTriangle, DollarSign, MessageCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Reports = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('defaulters'); // 'defaulters' | 'shortage'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) fetchData();
    }, [user, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'defaulters' ? '/api/reports/defaulters' : '/api/reports/shortage';
            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText /> School Reports
            </h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('defaulters')}
                    className={`pb-2 px-4 font-bold flex items-center gap-2 ${activeTab === 'defaulters' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                >
                    <DollarSign size={18} /> Fee Defaulters
                </button>
                <button
                    onClick={() => setActiveTab('shortage')}
                    className={`pb-2 px-4 font-bold flex items-center gap-2 ${activeTab === 'shortage' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}
                >
                    <AlertTriangle size={18} /> Attendance Shortage
                </button>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded p-6">
                {loading ? (
                    <p>Loading...</p>
                ) : data.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No records found for this category.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-3">Roll No</th>
                                    <th className="p-3">Student Name</th>
                                    <th className="p-3">Class</th>
                                    <th className="p-3 text-right">
                                        {activeTab === 'defaulters' ? 'Outstanding Balance' : 'Attendance %'}
                                    </th>
                                    <th className="p-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-mono text-sm">{item.student.roll_no}</td>
                                        <td className="p-3">
                                            <div className="font-bold">{item.student.full_name}</div>
                                            <div className="text-xs text-gray-500">Father: {item.father_name}</div>
                                        </td>
                                        <td className="p-3">{item.student.class_id}-{item.student.section_id}</td>
                                        <td className={`p-3 text-right font-bold ${activeTab === 'defaulters' ? 'text-red-600' : 'text-orange-600'}`}>
                                            {activeTab === 'defaulters'
                                                ? `Rs. ${item.totalBalance}`
                                                : `${item.percentage}% (${item.present}/${item.totalDays})`
                                            }
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => {
                                                    const msg = activeTab === 'defaulters'
                                                        ? `Dear Parent, please clear the outstanding dues of Rs. ${item.totalBalance} for ${item.student.full_name}.`
                                                        : `Dear Parent, ${item.student.full_name} has low attendance (${item.percentage}%). Please ensure regularity.`;
                                                    sendWhatsApp(item.father_mobile, msg);
                                                }}
                                                className="text-green-600 hover:bg-green-50 p-2 rounded border border-green-200"
                                                title="Notify via WhatsApp"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
