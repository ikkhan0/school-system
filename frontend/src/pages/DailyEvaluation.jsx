import { useState, useEffect, useContext } from 'react';
import { Save, AlertTriangle, X, MessageCircle, Check, Search } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const DailyEvaluation = () => {
    const { user } = useContext(AuthContext); // Added AuthContext
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [currentStudentId, setCurrentStudentId] = useState(null);
    const [schoolInfo, setSchoolInfo] = useState(null);

    useEffect(() => {
        if (!user) return;

        // Fetch school info
        const fetchSchoolInfo = async () => {
            try {
                const res = await fetch(`${API_URL}/api/school`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = await res.json();
                setSchoolInfo(data);
            } catch (error) {
                console.error("Error fetching school info:", error);
            }
        };

        const fetchClasses = async () => {
            try {
                const res = await fetch(`${API_URL}/api/classes`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = await res.json();
                setClasses(data);
                if (data.length > 0) {
                    setSelectedClass(data[0].name);
                    setSelectedSection(data[0].sections[0] || 'A');
                }
            } catch (error) {
                console.error("Error fetching classes:", error);
            }
        };

        fetchSchoolInfo();
        fetchClasses();
    }, [user]);

    useEffect(() => {
        if (selectedClass && selectedSection && user) {
            fetchStudents();
        }
    }, [selectedClass, selectedSection, date, user]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/evaluation/list?class_id=${selectedClass}&section_id=${selectedSection}&date=${date}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const sendWhatsApp = (mobile, message) => {
        if (!mobile) return alert("Father Mobile Number not found!");
        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) {
            num = '92' + num.substring(1);
        }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleStatusChange = (id, newStatus) => {
        setStudents(prev => prev.map(s => s.student_id === id ? { ...s, status: newStatus } : s));
        // Removed auto-whatsapp on status change to prevent spam, can re-enable if requested
    };

    const openEvaluationModal = (id) => {
        setCurrentStudentId(id);
        setModalOpen(true);
    };

    const toggleViolation = (field) => {
        setStudents(prev => prev.map(s =>
            s.student_id === currentStudentId ? { ...s, [field]: !s[field] } : s
        ));
    };

    const currentStudent = students.find(s => s.student_id === currentStudentId);

    const generateReportMessage = (student) => {
        const violations = [];
        if (student.uniform_violation) violations.push("Improper Uniform");
        if (student.shoes_violation) violations.push("No/Dirty Shoes");
        if (student.hygiene_violation) violations.push("Poor Hygiene");
        if (student.late_violation) violations.push("Late Arrival");
        if (student.homework_violation) violations.push("Incomplete Homework");
        if (student.books_violation) violations.push("Missing Books");

        const violationsText = violations.length > 0 ? `\n\nIssues Reported:\n- ${violations.join('\n- ')}` : "\n\nPerformance: Satisfactory";
        const remarks = student.teacher_remarks ? `\n\nTeacher Remarks: ${student.teacher_remarks}` : "";

        return `Dear Parent,\n\nDaily Report for ${student.name} (${date}):\nStatus: ${student.status}${violationsText}${remarks}\n\n- ${schoolInfo?.name || 'School'}`;
    };

    const handleSendReport = (student) => {
        const msg = generateReportMessage(student);
        sendWhatsApp(student.father_mobile, msg);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                date,
                evaluations: students.map(s => ({
                    student_id: s.student_id,
                    status: s.status,
                    uniform_violation: s.uniform_violation,
                    shoes_violation: s.shoes_violation,
                    hygiene_violation: s.hygiene_violation,
                    late_violation: s.late_violation,
                    homework_violation: s.homework_violation,
                    books_violation: s.books_violation,
                    teacher_remarks: s.teacher_remarks
                }))
            };

            await fetch(`${API_URL}/api/evaluation/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(payload)
            });
            alert('Saved Successfully!');
        } catch (error) {
            alert('Error saving data');
        } finally {
            setSaving(false);
        }
    };

    const getViolationCount = (s) => {
        let count = 0;
        if (s.uniform_violation) count++;
        if (s.shoes_violation) count++;
        if (s.hygiene_violation) count++;
        if (s.late_violation) count++;
        if (s.homework_violation) count++;
        if (s.books_violation) count++;
        return count;
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <header className="bg-white shadow rounded-lg p-3 sm:p-4 mb-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg sm:text-xl font-bold">Daily Evaluation</h1>
                        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded shadow font-bold flex items-center gap-2 hover:bg-blue-700 text-sm sm:text-base">
                            <Save size={16} className="sm:w-[18px] sm:h-[18px]" /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                const cls = classes.find(c => c.name === e.target.value);
                                if (cls && cls.sections.length > 0) setSelectedSection(cls.sections[0]);
                            }}
                            className="border rounded p-2 text-sm flex-1 sm:flex-none"
                        >
                            {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="border rounded p-2 text-sm flex-1 sm:flex-none sm:w-32"
                        >
                            {classes.find(c => c.name === selectedClass)?.sections.map(sec => (
                                <option key={sec} value={sec}>Section {sec}</option>
                            )) || <option value="A">Section A</option>}
                        </select>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border rounded p-2 text-sm flex-1 sm:flex-none"
                        />
                    </div>
                </div>
            </header>

            {/* Desktop Table View */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
                            <tr>
                                <th className="p-3 border-b border-r w-16 text-center">Roll</th>
                                <th className="p-3 border-b border-r">Student Name</th>
                                <th className="p-3 border-b border-r text-center w-48">Attendance</th>
                                <th className="p-3 border-b border-r text-center w-32">Violations</th>
                                <th className="p-3 border-b border-r">Remarks</th>
                                <th className="p-3 border-b text-center w-16">Notify</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.student_id} className="hover:bg-blue-50 transition-colors">
                                    <td className="p-3 border-r text-center font-mono font-bold text-gray-600">
                                        {student.roll_no}
                                    </td>
                                    <td className="p-3 border-r">
                                        <div className="font-medium text-gray-900">{student.name}</div>
                                        <div className="text-xs text-gray-500">Father: {student.father_mobile || 'N/A'}</div>
                                    </td>
                                    <td className="p-2 border-r text-center bg-gray-50">
                                        <div className="flex justify-center gap-1">
                                            {['Present', 'Absent', 'Leave'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(student.student_id, status)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs transition-all ${student.status === status
                                                        ? (status === 'Present' ? 'bg-green-600 text-white shadow-lg scale-110'
                                                            : status === 'Absent' ? 'bg-red-600 text-white shadow-lg scale-110'
                                                                : 'bg-yellow-500 text-white shadow-lg scale-110')
                                                        : 'bg-white border text-gray-400 hover:border-gray-400'
                                                        }`}
                                                    title={status}
                                                >
                                                    {status.charAt(0)}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-2 border-r text-center">
                                        <button
                                            onClick={() => openEvaluationModal(student.student_id)}
                                            className={`px-3 py-1 rounded text-xs font-semibold flex items-center justify-center gap-1 mx-auto ${getViolationCount(student) > 0
                                                ? 'bg-red-100 text-red-700 border border-red-200'
                                                : 'text-gray-400 hover:bg-gray-100'
                                                }`}
                                        >
                                            {getViolationCount(student) > 0 ? (
                                                <><AlertTriangle size={14} /> {getViolationCount(student)} Issues</>
                                            ) : (
                                                <span className="text-gray-400 font-normal">No Issues</span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-2 border-r">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none text-xs py-1"
                                            placeholder="Type remarks..."
                                            value={student.teacher_remarks || ''}
                                            onChange={(e) => setStudents(prev => prev.map(s => s.student_id === student.student_id ? { ...s, teacher_remarks: e.target.value } : s))}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => handleSendReport(student)}
                                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                            title="Send WhatsApp Report"
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {students.map((student) => (
                    <div key={student.student_id} className="bg-white shadow rounded-lg border border-gray-200 p-3">
                        {/* Student Info */}
                        <div className="flex items-start justify-between mb-3 pb-3 border-b">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-700 font-mono font-bold text-xs px-2 py-1 rounded">#{student.roll_no}</span>
                                    <h3 className="font-bold text-gray-900">{student.name}</h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Father: {student.father_mobile || 'N/A'}</p>
                            </div>
                            <button
                                onClick={() => handleSendReport(student)}
                                className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                                title="Send WhatsApp Report"
                            >
                                <MessageCircle size={20} />
                            </button>
                        </div>

                        {/* Attendance Buttons */}
                        <div className="mb-3">
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Attendance</label>
                            <div className="flex gap-2">
                                {['Present', 'Absent', 'Leave'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(student.student_id, status)}
                                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${student.status === status
                                            ? (status === 'Present' ? 'bg-green-600 text-white shadow-md'
                                                : status === 'Absent' ? 'bg-red-600 text-white shadow-md'
                                                    : 'bg-yellow-500 text-white shadow-md')
                                            : 'bg-gray-100 border text-gray-600'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Violations */}
                        <div className="mb-3">
                            <button
                                onClick={() => openEvaluationModal(student.student_id)}
                                className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${getViolationCount(student) > 0
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-50 text-gray-400 border border-gray-200'
                                    }`}
                            >
                                {getViolationCount(student) > 0 ? (
                                    <><AlertTriangle size={14} /> {getViolationCount(student)} Issues - Tap to Edit</>
                                ) : (
                                    <>No Issues - Tap to Add</>
                                )}
                            </button>
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Remarks</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                placeholder="Type remarks..."
                                value={student.teacher_remarks || ''}
                                onChange={(e) => setStudents(prev => prev.map(s => s.student_id === student.student_id ? { ...s, teacher_remarks: e.target.value } : s))}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal - Kept same logic but cleaner UI */}
            {modalOpen && currentStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all">
                        <div className="flex justify-between items-center mb-6 border-b pb-2">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{currentStudent.name}</h2>
                                <p className="text-xs text-gray-500">Roll No: {currentStudent.roll_no}</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <CheckboxCard label="Improper Uniform" checked={currentStudent.uniform_violation} onChange={() => toggleViolation('uniform_violation')} />
                            <CheckboxCard label="No/Dirty Shoes" checked={currentStudent.shoes_violation} onChange={() => toggleViolation('shoes_violation')} />
                            <CheckboxCard label="Poor Hygiene" checked={currentStudent.hygiene_violation} onChange={() => toggleViolation('hygiene_violation')} />
                            <CheckboxCard label="Late Arrival" checked={currentStudent.late_violation} onChange={() => toggleViolation('late_violation')} />
                            <CheckboxCard label="No Homework" checked={currentStudent.homework_violation} onChange={() => toggleViolation('homework_violation')} />
                            <CheckboxCard label="Missing Books" checked={currentStudent.books_violation} onChange={() => toggleViolation('books_violation')} />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => { handleSendReport(currentStudent); setModalOpen(false); }} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition shadow">
                                Send WhatsApp
                            </button>
                            <button onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200 transition">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// New Checkbox Card Component
const CheckboxCard = ({ label, checked, onChange }) => (
    <div
        onClick={onChange}
        className={`cursor-pointer p-3 rounded-lg border text-sm font-medium flex items-center justify-between transition-all ${checked ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
    >
        {label}
        {checked && <Check size={16} className="text-red-500" />}
    </div>
);

export default DailyEvaluation;
