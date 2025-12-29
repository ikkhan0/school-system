import { useState, useEffect, useContext } from 'react';
import { Settings, Plus, Trash, FileText, PieChart, Save, Search, Printer, Users, Coins } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const Funds = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('config'); // config, assign, report
    const [loading, setLoading] = useState(false);

    // Data
    const [heads, setHeads] = useState([]);
    const [classes, setClasses] = useState([]);

    // Config Form
    const [newHeadName, setNewHeadName] = useState('');
    const [newHeadAmount, setNewHeadAmount] = useState('');

    // Assign Form
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedHead, setSelectedHead] = useState('');
    const [fundAmount, setFundAmount] = useState('');
    const [monthRef, setMonthRef] = useState('');

    // Report
    const [reportData, setReportData] = useState(null);
    const [reportHead, setReportHead] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchHeads();
        fetchClasses();
    }, [user]);

    const fetchHeads = async () => {
        try {
            const res = await fetch(`${API_URL}/api/funds/heads`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setHeads(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
                if (data.length > 0) setSelectedClass(data[0].name);
            }
        } catch (error) { console.error(error); }
    };

    const handleAddHead = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/funds/heads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify({ name: newHeadName, default_amount: newHeadAmount })
            });
            if (res.ok) {
                alert('Fund Type Added');
                setNewHeadName('');
                setNewHeadAmount('');
                fetchHeads();
            } else {
                alert('Error adding fund type');
            }
        } catch (error) { alert('Error adding fund type'); }
    };

    const handleDeleteHead = async (id) => {
        if (!confirm('Delete this fund type?')) return;
        try {
            await fetch(`${API_URL}/api/funds/heads/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchHeads();
        } catch (error) { alert('Error deleting'); }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!confirm(`Assign ${fundAmount} to selected class?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/funds/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify({
                    class_id: selectedClass,
                    section_id: 'All',
                    amount: fundAmount,
                    month_reference: monthRef,
                    fee_head_id: selectedHead
                })
            });
            const result = await res.json();
            alert(result.message);
        } catch (error) { alert('Error generating'); }
        finally { setLoading(false); }
    };

    const loadReport = async () => {
        if (!reportHead) return;
        setLoading(true);
        try {
            // We need the Name of the head for the report API "title" param
            const headObj = heads.find(h => h._id === reportHead);
            if (!headObj) return;

            const res = await fetch(`${API_URL}/api/funds/report?title=${encodeURIComponent(headObj.name)}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setReportData(data);
        } catch (error) { alert('Error loading report'); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Coins /> Manage Funds</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b overflow-x-auto">
                <button onClick={() => setActiveTab('config')} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap ${activeTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Fund Configuration</button>
                <button onClick={() => setActiveTab('assign')} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap ${activeTab === 'assign' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>Assign Funds</button>
                <button onClick={() => setActiveTab('report')} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap ${activeTab === 'report' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`}>Reports</button>
            </div>

            {activeTab === 'config' && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18} /> Add New Fund Type</h3>
                        <form onSubmit={handleAddHead} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Fund Name</label>
                                <input type="text" value={newHeadName} onChange={e => setNewHeadName(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. Paper Fund" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Default Amount</label>
                                <input type="number" value={newHeadAmount} onChange={e => setNewHeadAmount(e.target.value)} className="w-full border p-2 rounded" placeholder="0" />
                            </div>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full font-bold">Add Fund Type</button>
                        </form>
                    </div>
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Settings size={18} /> Existing Funds</h3>
                        <ul>
                            {heads.map(h => (
                                <li key={h._id} className="flex justify-between items-center py-3 border-b hover:bg-gray-50 px-2 transition">
                                    <div>
                                        <p className="font-bold">{h.name}</p>
                                        <p className="text-sm text-gray-500">Default: Rs. {h.default_amount}</p>
                                    </div>
                                    <button onClick={() => handleDeleteHead(h._id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><Trash size={16} /></button>
                                </li>
                            ))}
                            {heads.length === 0 && <p className="text-gray-500 text-center py-4">No funds configured.</p>}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'assign' && (
                <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><FileText size={18} /> Assign Fund to Class</h3>
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Select Class</label>
                            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border p-2 rounded">
                                {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Select Fund Type</label>
                            <select value={selectedHead} onChange={e => {
                                setSelectedHead(e.target.value);
                                const h = heads.find(x => x._id === e.target.value);
                                if (h) setFundAmount(h.default_amount);
                            }} className="w-full border p-2 rounded" required>
                                <option value="">-- Select Fund --</option>
                                {heads.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Amount</label>
                            <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} className="w-full border p-2 rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Reference / Month (Unique Identifier)</label>
                            <input type="text" value={monthRef} onChange={e => setMonthRef(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. Paper-Jan" required />
                            <p className="text-xs text-orange-600 mt-1 font-bold">Important: Use a unique reference (e.g. "Paper-Jan" or "Exam-Term1") to ensure it doesn't conflict with monthly tuition fees.</p>
                        </div>
                        <button disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded font-bold w-full hover:bg-green-700 transition">
                            {loading ? 'Processing...' : 'Generate Fees'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'report' && (
                <div className="bg-white p-6 rounded shadow">
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-1">Select Fund Report</label>
                            <select value={reportHead} onChange={e => setReportHead(e.target.value)} className="w-full border p-2 rounded">
                                <option value="">-- Select Fund --</option>
                                {heads.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                            </select>
                        </div>
                        <button onClick={loadReport} className="bg-purple-600 text-white px-6 py-2 rounded font-bold hover:bg-purple-700">View Report</button>
                    </div>

                    {reportData && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded text-center border-b-4 border-blue-500">
                                    <p className="text-sm text-gray-600">Total Students</p>
                                    <p className="text-2xl font-bold">{reportData.stats.total_students}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded text-center border-b-4 border-green-500">
                                    <p className="text-sm text-gray-600">Paid Count</p>
                                    <p className="text-2xl font-bold text-green-600">{reportData.stats.paid_count}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded text-center border-b-4 border-red-500">
                                    <p className="text-sm text-gray-600">Unpaid Count</p>
                                    <p className="text-2xl font-bold text-red-600">{reportData.stats.unpaid_count}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded text-center border-b-4 border-purple-500">
                                    <p className="text-sm text-gray-600">Total Collected</p>
                                    <p className="text-2xl font-bold text-purple-600">Rs. {reportData.stats.collected_amount}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left bg-gray-50 rounded">
                                    <thead className="bg-gray-200 uppercase text-xs font-bold text-gray-600">
                                        <tr>
                                            <th className="p-3">Roll No</th>
                                            <th className="p-3">Student Name</th>
                                            <th className="p-3">Month/Ref</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {reportData.details.map((d, i) => (
                                            <tr key={i} className="hover:bg-gray-100">
                                                <td className="p-3 font-mono">{d.student?.roll_no}</td>
                                                <td className="p-3 font-bold">{d.student?.full_name}</td>
                                                <td className="p-3 text-xs text-gray-500">{d.month}</td>
                                                <td className="p-3 text-right">{d.amount}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs text-white font-bold ${d.status === 'Paid' ? 'bg-green-500' : 'bg-red-500'}`}>{d.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Funds;
