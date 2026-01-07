import { useState, useEffect, useContext } from 'react';
import { DollarSign, Plus, Search, Users, Trash, CheckCircle, XCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const StudentCustomFees = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // Data
    const [feeHeads, setFeeHeads] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [customFees, setCustomFees] = useState([]);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Form
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [formData, setFormData] = useState({
        fee_head_id: '',
        amount: '',
        applied_to_month: '',
        reason: '',
        description: ''
    });

    useEffect(() => {
        if (!user) return;
        fetchFeeHeads();
        fetchClasses();
        fetchCustomFees();
    }, [user]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
        }
    }, [selectedClass]);

    const fetchFeeHeads = async () => {
        try {
            const res = await fetch(`${API_URL}/api/funds/heads`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setFeeHeads(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setClasses(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch(`${API_URL}/api/students?class_id=${selectedClass}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setStudents(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchCustomFees = async () => {
        try {
            const res = await fetch(`${API_URL}/api/student-fees/pending`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setCustomFees(await res.json());
        } catch (error) { console.error(error); }
    };

    const handleStudentSelect = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s._id));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/student-fees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    student_ids: selectedStudents,
                    ...formData
                })
            });

            const result = await res.json();
            if (res.ok) {
                alert(`✅ Fee applied to ${result.created} student(s)!`);
                setSelectedStudents([]);
                setFormData({
                    fee_head_id: '',
                    amount: '',
                    applied_to_month: '',
                    reason: '',
                    description: ''
                });
                fetchCustomFees();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error applying fee');
        } finally {
            setLoading(false);
        }
    };

    const handleWaive = async (feeId) => {
        if (!confirm('Waive this fee?')) return;
        try {
            const res = await fetch(`${API_URL}/api/student-fees/${feeId}/waive`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ waiver_reason: 'Manual waiver' })
            });
            if (res.ok) {
                alert('Fee waived');
                fetchCustomFees();
            }
        } catch (error) { alert('Error waiving fee'); }
    };

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedFeeHead = feeHeads.find(h => h._id === formData.fee_head_id);

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <DollarSign /> Student Custom Fees
            </h1>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Apply Custom Fee Form */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Plus size={20} /> Apply Custom Fee
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Fee Type</label>
                            <select
                                value={formData.fee_head_id}
                                onChange={e => {
                                    const head = feeHeads.find(h => h._id === e.target.value);
                                    setFormData({
                                        ...formData,
                                        fee_head_id: e.target.value,
                                        amount: head?.default_amount || ''
                                    });
                                }}
                                className="w-full border p-2 rounded"
                                required
                            >
                                <option value="">-- Select Fee Type --</option>
                                {feeHeads.map(h => (
                                    <option key={h._id} value={h._id}>
                                        {h.name} ({h.category})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Amount</label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full border p-2 rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Apply to Month</label>
                            <input
                                type="text"
                                value={formData.applied_to_month}
                                onChange={e => setFormData({ ...formData, applied_to_month: e.target.value })}
                                className="w-full border p-2 rounded"
                                placeholder="e.g., Jan-2026, Admission, One-time"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Reason</label>
                            <input
                                type="text"
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                className="w-full border p-2 rounded"
                                placeholder="e.g., New admission, Late fine"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border p-2 rounded"
                                rows="2"
                            />
                        </div>

                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-bold text-blue-800">
                                Selected Students: {selectedStudents.length}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || selectedStudents.length === 0}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Applying...' : `Apply Fee to ${selectedStudents.length} Student(s)`}
                        </button>
                    </form>
                </div>

                {/* Student Selection */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Users size={20} /> Select Students
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Class</label>
                            <select
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">-- Select Class --</option>
                                {classes.map(c => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Search</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full border p-2 rounded"
                                placeholder="Search by name or roll no..."
                            />
                        </div>

                        {filteredStudents.length > 0 && (
                            <div>
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm text-blue-600 hover:underline mb-2"
                                >
                                    {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                                </button>

                                <div className="max-h-96 overflow-y-auto border rounded">
                                    {filteredStudents.map(student => (
                                        <label
                                            key={student._id}
                                            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student._id)}
                                                onChange={() => handleStudentSelect(student._id)}
                                                className="mr-3"
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold">{student.full_name}</p>
                                                <p className="text-sm text-gray-500">Roll: {student.roll_no}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Custom Fees */}
            <div className="mt-6 bg-white p-6 rounded shadow">
                <h2 className="font-bold text-lg mb-4">Pending Custom Fees</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Student</th>
                                <th className="p-3 text-left">Fee Type</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3 text-left">Month</th>
                                <th className="p-3 text-left">Reason</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customFees.map(fee => (
                                <tr key={fee._id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                        <p className="font-bold">{fee.student_id?.full_name}</p>
                                        <p className="text-sm text-gray-500">{fee.student_id?.roll_no}</p>
                                    </td>
                                    <td className="p-3">{fee.fee_head_id?.name}</td>
                                    <td className="p-3 text-right font-bold">Rs. {fee.amount}</td>
                                    <td className="p-3 text-sm">{fee.applied_to_month}</td>
                                    <td className="p-3 text-sm">{fee.reason}</td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => handleWaive(fee._id)}
                                            className="text-orange-600 hover:bg-orange-100 px-2 py-1 rounded text-sm"
                                        >
                                            Waive
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {customFees.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        No pending custom fees
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentCustomFees;
