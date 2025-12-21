import { useState, useEffect, useContext } from 'react';
import { Save } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const MarksEntry = () => {
    const { user } = useContext(AuthContext); // Get user token
    // Mock Selections
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('Math');
    const [examId, setExamId] = useState('');
    const [exams, setExams] = useState([]);

    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({}); // { studentId: obtainedMarks }
    const [totalMarks, setTotalMarks] = useState(100);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Fetch Exams
        fetch('http://localhost:5000/api/exams', {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setExams(data);
                if (data.length > 0) setExamId(data[0]._id);
            });

        // Fetch Classes
        fetch('http://localhost:5000/api/classes', {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setClasses(data);
                if (data.length > 0) {
                    setSelectedClass(data[0].name);
                    setSelectedSection(data[0].sections[0] || 'A');
                }
            });
    }, [user]);

    useEffect(() => {
        // Fetch students
        if (!user) return;
        fetch(`http://localhost:5000/api/students/list?class_id=${selectedClass}&section_id=${selectedSection}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => setStudents(data));
    }, [selectedClass, selectedSection, user]);

    const handleMarkChange = (studentId, val) => {
        setMarks(prev => ({ ...prev, [studentId]: val }));
    };

    const handleSave = async () => {
        setSaving(true);
        const marksData = students.map(s => ({
            student_id: s._id,
            obtained_marks: Number(marks[s._id] || 0),
            total_marks: Number(totalMarks)
        }));

        try {
            const res = await fetch('http://localhost:5000/api/exams/marks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    exam_id: examId,
                    class_id: selectedClass,
                    section_id: selectedSection,
                    subject: selectedSubject,
                    marks_data: marksData
                })
            });
            const data = await res.json();
            alert(data.message);
        } catch (error) {
            console.error(error);
            alert('Error Saving Marks');
        } finally {
            setSaving(false);
        }
    };

    // Auto-focus next input on Enter
    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = document.getElementById(`mark-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <header className="bg-white shadow rounded-lg p-4 mb-6">
                <h1 className="text-xl font-bold mb-4">Marks Entry</h1>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <select className="border p-2 rounded" value={examId} onChange={e => setExamId(e.target.value)}>
                        {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                    </select>

                    <select
                        className="border p-2 rounded"
                        value={selectedClass}
                        onChange={e => {
                            setSelectedClass(e.target.value);
                            const cls = classes.find(c => c.name === e.target.value);
                            if (cls && cls.sections.length > 0) setSelectedSection(cls.sections[0]);
                        }}
                    >
                        {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>

                    <select className="border p-2 rounded" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                        {classes.find(c => c.name === selectedClass)?.sections.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                        )) || <option value="A">A</option>}
                    </select>

                    <select className="border p-2 rounded" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                        <option>Math</option>
                        <option>English</option>
                        <option>Science</option>
                        <option>Urdu</option>
                        <option>Islamiyat</option>
                        <option>Social Studies</option>
                        <option>Computer</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Total Marks"
                        value={totalMarks}
                        onChange={e => setTotalMarks(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <button onClick={handleSave} disabled={saving} className="bg-green-600 text-white rounded p-2 flex justify-center items-center gap-2">
                        <Save size={18} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </header>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Roll No</th>
                            <th className="px-4 py-3 text-left">Student</th>
                            <th className="px-4 py-3 text-left">Marks (Out of {totalMarks})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {students.map((student, index) => (
                            <tr key={student._id}>
                                <td className="px-4 py-3">{student.roll_no}</td>
                                <td className="px-4 py-3">{student.full_name}</td>
                                <td className="px-4 py-3">
                                    <input
                                        id={`mark-input-${index}`}
                                        type="number"
                                        className="border rounded p-1 w-24 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={marks[student._id] || ''}
                                        onChange={(e) => handleMarkChange(student._id, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MarksEntry;
