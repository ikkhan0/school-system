import { useState, useEffect } from 'react';
import { Save, AlertTriangle, X, MessageCircle } from 'lucide-react';

const DailyEvaluation = () => {
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

    // 1. Fetch Classes on Mount
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/classes');
                const data = await res.json();
                setClasses(data);
                if (data.length > 0) {
                    setSelectedClass(data[0].name); // Default to first class name
                    // Assuming sections are uniform or just picking 'A' default
                    // In a real app, we'd pick data[0].sections[0]
                    setSelectedSection(data[0].sections[0] || 'A');
                }
            } catch (error) {
                console.error("Error fetching classes:", error);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass && selectedSection) {
            fetchStudents();
        }
    }, [selectedClass, selectedSection, date]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/evaluation/list?class_id=${selectedClass}&section_id=${selectedSection}&date=${date}`);
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
        // Remove leading 0 if 11 digits (0300...), add 92 (92300...)
        let num = mobile.replace(/\D/g, ''); // strip non-digits
        if (num.length === 11 && num.startsWith('0')) {
            num = '92' + num.substring(1);
        }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleStatusChange = (id, newStatus) => {
        setStudents(prev => prev.map(s => s.student_id === id ? { ...s, status: newStatus } : s));

        // Immediate WhatsApp Logic
        const student = students.find(s => s.student_id === id);
        if (student && student.father_mobile) {
            let text = "";
            if (newStatus === 'Absent') {
                text = `Dear Parent,\n\n${student.name} is ABSENT today (${date}).\nPlease ensure regular attendance.\n\n- Bismillah Educational Complex`;
            } else if (newStatus === 'Present') {
                // Optional: Send Present message? Maybe too spammy, user can decide.
                // Keeping it manual or only for Absent usually.
                // text = `Dear Parent,\n\n${student.name} is PRESENT today (${date}).\n\n- Bismillah Educational Complex`;
            }

            if (text) {
                sendWhatsApp(student.father_mobile, text);
            }
        }
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

        return `Dear Parent,\n\nDaily Report for ${student.name} (${date}):\nStatus: ${student.status}${violationsText}${remarks}\n\n- Bismillah Educational Complex`;
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

            await fetch('http://localhost:5000/api/evaluation/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            alert('Saved Successfully!');
        } catch (error) {
            alert('Error saving data');
        } finally {
            setSaving(false);
        }
    };

    // Helper to get active violation count for badge
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
        <div className="max-w-4xl mx-auto p-4">
            <header className="bg-white shadow rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold mb-2">Smart Attendance & Daily Log</h1>
                    <div className="flex gap-2">
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                // Update section to default of new class if needed, or keep 'A'
                                const cls = classes.find(c => c.name === e.target.value);
                                if (cls && cls.sections.length > 0) setSelectedSection(cls.sections[0]);
                            }}
                            className="border rounded p-1 text-sm"
                        >
                            {classes.map(c => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="border rounded p-1 text-sm"
                        >
                            {/* Logic to show sections for selected class */}
                            {classes.find(c => c.name === selectedClass)?.sections.map(sec => (
                                <option key={sec} value={sec}>Sec {sec}</option>
                            )) || <option value="A">Sec A</option>}
                        </select>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border rounded p-1 text-sm"
                        />
                    </div>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                    <Save size={18} /> {saving ? 'Saving...' : 'Save All'}
                </button>
            </header>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {students.map((student) => (
                    <div key={student.student_id} className="border-b p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">{student.name}</h3>
                            <p className="text-sm text-gray-500">{student.roll_no}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Attendance Toggles */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {['Present', 'Absent', 'Leave'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(student.student_id, status)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${student.status === status
                                            ? (status === 'Present' ? 'bg-green-500 text-white shadow'
                                                : status === 'Absent' ? 'bg-red-500 text-white shadow'
                                                    : 'bg-yellow-500 text-white shadow')
                                            : 'text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status.charAt(0)}
                                    </button>
                                ))}
                            </div>

                            {/* Evaluation Button */}
                            <button
                                onClick={() => openEvaluationModal(student.student_id)}
                                className={`px-3 py-1.5 rounded border text-sm flex items-center gap-2 ${getViolationCount(student) > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-300'
                                    }`}
                            >
                                <AlertTriangle size={16} />
                                Eval
                                {getViolationCount(student) > 0 && (
                                    <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {getViolationCount(student)}
                                    </span>
                                )}
                            </button>

                            {/* Quick WhatsApp Button */}
                            <button
                                onClick={() => handleSendReport(student)}
                                className="p-2 rounded-full text-green-600 hover:bg-green-50 border border-green-200"
                                title="Send Daily Report on WhatsApp"
                            >
                                <MessageCircle size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && currentStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Evaluation: {currentStudent.name}</h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <CheckboxRow label="Improper Uniform" checked={currentStudent.uniform_violation} onChange={() => toggleViolation('uniform_violation')} />
                            <CheckboxRow label="No Shoes / Dirty" checked={currentStudent.shoes_violation} onChange={() => toggleViolation('shoes_violation')} />
                            <CheckboxRow label="Poor Hygiene" checked={currentStudent.hygiene_violation} onChange={() => toggleViolation('hygiene_violation')} />
                            <CheckboxRow label="Late Arrival" checked={currentStudent.late_violation} onChange={() => toggleViolation('late_violation')} />
                            <CheckboxRow label="Homework Incomplete" checked={currentStudent.homework_violation} onChange={() => toggleViolation('homework_violation')} />
                            <CheckboxRow label="Books Missing" checked={currentStudent.books_violation} onChange={() => toggleViolation('books_violation')} />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Remarks</label>
                            <textarea
                                className="w-full border rounded p-2 text-sm"
                                rows="2"
                                placeholder="Optional remarks..."
                                value={currentStudent.teacher_remarks || ''}
                                onChange={(e) => setStudents(prev => prev.map(s => s.student_id === currentStudentId ? { ...s, teacher_remarks: e.target.value } : s))}
                            ></textarea>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button onClick={() => { handleSendReport(currentStudent); setModalOpen(false); }} className="flex-1 bg-green-600 text-white py-2 rounded font-bold flex justify-center items-center gap-2">
                                <MessageCircle size={18} /> Send & Close
                            </button>
                            <button onClick={() => setModalOpen(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-bold">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CheckboxRow = ({ label, checked, onChange }) => (
    <div
        onClick={onChange}
        className={`flex items-center justify-between p-3 rounded cursor-pointer border ${checked ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}
    >
        <span className={checked ? 'text-red-700 font-medium' : 'text-gray-700'}>{label}</span>
        <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-red-600 border-red-600' : 'bg-white border-gray-400'
            }`}>
            {checked && <span className="text-white text-xs">✓</span>}
        </div>
    </div>
);

export default DailyEvaluation;
