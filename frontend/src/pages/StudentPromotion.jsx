import { useState, useEffect, useContext } from 'react';
import { Users, ArrowRight, Check, X, AlertCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { SessionContext } from '../context/SessionContext';
import API_URL from '../config';
import axios from 'axios';

const StudentPromotion = () => {
    const { user } = useContext(AuthContext);
    const { activeSessions } = useContext(SessionContext);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        from_session: '',
        from_class: '',
        from_section: '',
        to_session: '',
        to_class: '',
        to_section: ''
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchEligibleStudents = async () => {
        if (!filters.from_session || !filters.from_class) {
            alert('Please select session and class');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(
                `${API_URL}/api/promotions/eligible`,
                {
                    params: {
                        from_session: filters.from_session,
                        class_id: filters.from_class,
                        section_id: filters.from_section
                    },
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            setStudents(response.data);
            // Select all by default
            setSelectedStudents(response.data.map(s => ({
                student_id: s._id,
                final_result_status: 'Promoted',
                remarks: '',
                new_roll_no: s.roll_no
            })));
        } catch (error) {
            console.error('Error fetching students:', error);
            alert('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!filters.to_session || !filters.to_class) {
            alert('Please select target session and class');
            return;
        }

        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        if (!confirm(`Promote ${selectedStudents.length} students to ${filters.to_class}${filters.to_section ? `-${filters.to_section}` : ''}?`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/promotions/promote`,
                {
                    from_session_id: filters.from_session,
                    to_session_id: filters.to_session,
                    to_class_id: filters.to_class,
                    to_section_id: filters.to_section || '',
                    students: selectedStudents
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            alert(`Promotion completed!\n\nPromoted: ${response.data.summary.promoted}\nFailed: ${response.data.summary.failed}`);

            // Reset
            setStudents([]);
            setSelectedStudents([]);
            setFilters({ ...filters, from_class: '', from_section: '' });
        } catch (error) {
            console.error('Error promoting students:', error);
            alert(error.response?.data?.message || 'Failed to promote students');
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (studentId) => {
        const exists = selectedStudents.find(s => s.student_id === studentId);
        if (exists) {
            setSelectedStudents(selectedStudents.filter(s => s.student_id !== studentId));
        } else {
            const student = students.find(s => s._id === studentId);
            setSelectedStudents([...selectedStudents, {
                student_id: studentId,
                final_result_status: 'Promoted',
                remarks: '',
                new_roll_no: student.roll_no
            }]);
        }
    };

    const updateStudentData = (studentId, field, value) => {
        setSelectedStudents(selectedStudents.map(s =>
            s.student_id === studentId ? { ...s, [field]: value } : s
        ));
    };

    const fromSession = activeSessions.find(s => s._id === filters.from_session);
    const toSession = activeSessions.find(s => s._id === filters.to_session);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Student Promotion</h1>
                <p className="text-gray-600 text-sm mt-1">Promote students to next academic year</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Select Students to Promote</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* From Session */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Session *
                        </label>
                        <select
                            value={filters.from_session}
                            onChange={(e) => setFilters({ ...filters, from_session: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                            <option value="">Select Session</option>
                            {activeSessions.map(session => (
                                <option key={session._id} value={session._id}>
                                    {session.session_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* From Class */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Class *
                        </label>
                        <select
                            value={filters.from_class}
                            onChange={(e) => setFilters({ ...filters, from_class: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                            <option value="">Select Class</option>
                            {classes.map(cls => (
                                <option key={cls._id} value={cls.name}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* From Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Section (Optional)
                        </label>
                        <select
                            value={filters.from_section}
                            onChange={(e) => setFilters({ ...filters, from_section: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                            <option value="">All Sections</option>
                            {filters.from_class && classes.find(c => c.name === filters.from_class)?.sections.map(section => (
                                <option key={section} value={section}>
                                    {section}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={fetchEligibleStudents}
                    disabled={loading || !filters.from_session || !filters.from_class}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? 'Loading...' : 'Load Students'}
                </button>
            </div>

            {/* Promotion Target */}
            {students.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Promote To</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* To Session */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Session *
                            </label>
                            <select
                                value={filters.to_session}
                                onChange={(e) => setFilters({ ...filters, to_session: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="">Select Session</option>
                                {activeSessions.filter(s => s._id !== filters.from_session).map(session => (
                                    <option key={session._id} value={session._id}>
                                        {session.session_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* To Class */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Class *
                            </label>
                            <select
                                value={filters.to_class}
                                onChange={(e) => setFilters({ ...filters, to_class: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls._id} value={cls.name}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* To Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Section (Optional)
                            </label>
                            <select
                                value={filters.to_section}
                                onChange={(e) => setFilters({ ...filters, to_section: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="">Select Section</option>
                                {filters.to_class && classes.find(c => c.name === filters.to_class)?.sections.map(section => (
                                    <option key={section} value={section}>
                                        {section}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Students List */}
            {students.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">
                            Students ({selectedStudents.length} selected)
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedStudents(students.map(s => ({
                                    student_id: s._id,
                                    final_result_status: 'Promoted',
                                    remarks: '',
                                    new_roll_no: s.roll_no
                                })))}
                                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setSelectedStudents([])}
                                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee Balance</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {students.map((student) => {
                                    const isSelected = selectedStudents.find(s => s.student_id === student._id);
                                    return (
                                        <tr key={student._id} className={isSelected ? 'bg-blue-50' : ''}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={!!isSelected}
                                                    onChange={() => toggleStudent(student._id)}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm">{student.roll_no}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{student.full_name}</td>
                                            <td className="px-4 py-3 text-sm">{student.class_id}-{student.section_id}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={student.fee_balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                                    Rs. {student.fee_balance?.toLocaleString() || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {isSelected && (
                                                    <select
                                                        value={isSelected.final_result_status}
                                                        onChange={(e) => updateStudentData(student._id, 'final_result_status', e.target.value)}
                                                        className="text-xs border rounded px-2 py-1"
                                                    >
                                                        <option value="Promoted">Promoted</option>
                                                        <option value="Failed">Failed</option>
                                                        <option value="Detained">Detained</option>
                                                    </select>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {selectedStudents.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-blue-600 mt-1" size={20} />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900 mb-2">Promotion Summary</h3>
                                    <p className="text-sm text-blue-800">
                                        {selectedStudents.length} students will be promoted from{' '}
                                        <strong>{fromSession?.session_name}</strong> to{' '}
                                        <strong>{toSession?.session_name}</strong>
                                    </p>
                                    <p className="text-sm text-blue-800 mt-1">
                                        Fee balances will be carried forward as opening balance in the new session.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handlePromote}
                                disabled={loading || !filters.to_session || !filters.to_class}
                                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                            >
                                <ArrowRight size={18} />
                                Promote {selectedStudents.length} Students
                            </button>
                        </div>
                    )}
                </div>
            )}

            {students.length === 0 && !loading && filters.from_session && filters.from_class && (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Students Found</h3>
                    <p className="text-gray-500">No students found in the selected class and session</p>
                </div>
            )}
        </div>
    );
};

export default StudentPromotion;
