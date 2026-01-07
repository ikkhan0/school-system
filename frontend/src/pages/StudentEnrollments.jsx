import { useState, useEffect, useContext } from 'react';
import { Users, Plus, Search, Award, Trash, CheckCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const StudentEnrollments = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('enroll'); // enroll, manage

    // Data
    const [feeHeads, setFeeHeads] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [enrollmentStats, setEnrollmentStats] = useState(null);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFeeHead, setSelectedFeeHead] = useState('');

    // Form
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [monthlyFee, setMonthlyFee] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchFeeHeads();
        fetchClasses();
        fetchEnrollmentStats();
    }, [user]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedFeeHead && activeTab === 'manage') {
            fetchEnrollments();
        }
    }, [selectedFeeHead, activeTab]);

    const fetchFeeHeads = async () => {
        try {
            const res = await fetch(`${API_URL}/api/funds/heads`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
                const heads = await res.json();
                // Filter only those that require enrollment (clubs, societies, transport)
                setFeeHeads(heads.filter(h => h.requires_enrollment));
            }
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

    const fetchEnrollments = async () => {
        try {
            const res = await fetch(`${API_URL}/api/enrollments/fee-head/${selectedFeeHead}?is_active=true`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setEnrollments(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchEnrollmentStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/enrollments/stats`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setEnrollmentStats(await res.json());
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

    const handleEnroll = async (e) => {
        e.preventDefault();
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }
        if (!selectedFeeHead) {
            alert('Please select a club/society/transport');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/enrollments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    student_ids: selectedStudents,
                    fee_head_id: selectedFeeHead,
                    monthly_fee: monthlyFee || undefined
                })
            });

            const result = await res.json();
            if (res.ok) {
                alert(`✅ Enrolled ${result.created} student(s)!`);
                setSelectedStudents([]);
                setMonthlyFee('');
                fetchEnrollmentStats();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error enrolling students');
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async (enrollmentId) => {
        if (!confirm('Un-enroll this student?')) return;
        try {
            const res = await fetch(`${API_URL}/api/enrollments/${enrollmentId}/deactivate`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
                alert('Student un-enrolled');
                fetchEnrollments();
                fetchEnrollmentStats();
            }
        } catch (error) { alert('Error un-enrolling'); }
    };

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedHead = feeHeads.find(h => h._id === selectedFeeHead);

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Award /> Student Enrollments (Clubs/Societies/Transport)
            </h1>

            {/* Stats Cards */}
            {enrollmentStats && (
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600">Total Active Enrollments</p>
                        <p className="text-2xl font-bold text-blue-600">{enrollmentStats.total_active_enrollments}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
                        <p className="text-sm text-gray-600">Total Clubs/Societies</p>
                        <p className="text-2xl font-bold text-green-600">{enrollmentStats.by_fee_head?.length || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                        <p className="text-sm text-gray-600">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-purple-600">
                            Rs. {enrollmentStats.by_fee_head?.reduce((sum, item) => sum + item.total_monthly_revenue, 0) || 0}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('enroll')}
                    className={`px-4 py-2 border-b-2 font-bold ${activeTab === 'enroll' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                >
                    Enroll Students
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-4 py-2 border-b-2 font-bold ${activeTab === 'manage' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
                >
                    Manage Enrollments
                </button>
            </div>

            {activeTab === 'enroll' && (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Enrollment Form */}
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Plus size={20} /> Enroll Students
                        </h2>

                        <form onSubmit={handleEnroll} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Club/Society/Transport</label>
                                <select
                                    value={selectedFeeHead}
                                    onChange={e => {
                                        const head = feeHeads.find(h => h._id === e.target.value);
                                        setSelectedFeeHead(e.target.value);
                                        setMonthlyFee(head?.default_amount || '');
                                    }}
                                    className="w-full border p-2 rounded"
                                    required
                                >
                                    <option value="">-- Select --</option>
                                    {feeHeads.map(h => (
                                        <option key={h._id} value={h._id}>
                                            {h.name} ({h.category})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedHead && (
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm"><span className="font-bold">Category:</span> {selectedHead.category}</p>
                                    <p className="text-sm"><span className="font-bold">Default Fee:</span> Rs. {selectedHead.default_amount}</p>
                                    <p className="text-sm text-gray-600">{selectedHead.description}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold mb-1">Monthly Fee (Optional)</label>
                                <input
                                    type="number"
                                    value={monthlyFee}
                                    onChange={e => setMonthlyFee(e.target.value)}
                                    className="w-full border p-2 rounded"
                                    placeholder="Leave blank to use default amount"
                                />
                                <p className="text-xs text-gray-500 mt-1">Override default amount for selected students</p>
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
                                {loading ? 'Enrolling...' : `Enroll ${selectedStudents.length} Student(s)`}
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
            )}

            {activeTab === 'manage' && (
                <div className="bg-white p-6 rounded shadow">
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-1">Select Club/Society/Transport</label>
                        <select
                            value={selectedFeeHead}
                            onChange={e => setSelectedFeeHead(e.target.value)}
                            className="w-full max-w-md border p-2 rounded"
                        >
                            <option value="">-- Select --</option>
                            {feeHeads.map(h => (
                                <option key={h._id} value={h._id}>{h.name}</option>
                            ))}
                        </select>
                    </div>

                    {enrollments.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 text-left">Student</th>
                                        <th className="p-3 text-left">Enrolled Date</th>
                                        <th className="p-3 text-right">Monthly Fee</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map(enrollment => (
                                        <tr key={enrollment._id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <p className="font-bold">{enrollment.student_id?.full_name}</p>
                                                <p className="text-sm text-gray-500">{enrollment.student_id?.roll_no}</p>
                                            </td>
                                            <td className="p-3 text-sm">
                                                {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-right font-bold">
                                                Rs. {enrollment.monthly_fee || selectedHead?.default_amount || 0}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleUnenroll(enrollment._id)}
                                                    className="text-red-600 hover:bg-red-100 px-2 py-1 rounded text-sm"
                                                >
                                                    Un-enroll
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {selectedFeeHead && enrollments.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No students enrolled yet</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentEnrollments;
