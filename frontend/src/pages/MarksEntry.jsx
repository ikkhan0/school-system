import { useState, useEffect, useContext } from 'react';
import { Save } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const MarksEntry = () => {
    const { user } = useContext(AuthContext);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [classes, setClasses] = useState([]);
    const [classSubjects, setClassSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [examId, setExamId] = useState('');
    const [exams, setExams] = useState([]);

    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({}); // { studentId: obtainedMarks }
    const [totalMarks, setTotalMarks] = useState(100);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Fetch Exams
        fetch(`${API_URL}/api/exams`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setExams(data);
                if (data.length > 0) setExamId(data[0]._id);
            });

        // Fetch Classes
        fetch(`${API_URL}/api/classes`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setClasses(data);
                if (data.length > 0) {
                    const firstClass = data[0];
                    setSelectedClass(firstClass._id);
                    setSelectedSection(firstClass.sections[0] || 'A');
                    // Fetch subjects for first class
                    fetchClassSubjects(firstClass._id);
                }
            });
    }, [user]);

    // Fetch subjects for selected class
    const fetchClassSubjects = async (classId) => {
        if (!classId) return;

        try {
            const res = await fetch(`${API_URL}/api/subjects/class/${classId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setClassSubjects(data);

            // Auto-select first subject and set its total marks
            if (data.length > 0) {
                setSelectedSubject(data[0].name);
                setTotalMarks(data[0].total_marks);
            } else {
                setSelectedSubject('');
                setTotalMarks(100);
            }
        } catch (error) {
            console.error('Error fetching class subjects:', error);
            setClassSubjects([]);
        }
    };

    // Fetch students when class/section changes
    useEffect(() => {
        if (!user || !selectedClass || !selectedSection) return;

        // Get class name from selected class ID
        const classData = classes.find(c => c._id === selectedClass);
        if (!classData) return;

        setLoading(true);
        fetch(`${API_URL}/api/students/list?class_id=${classData.name}&section_id=${selectedSection}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setStudents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [selectedClass, selectedSection, user, classes]);

    // Load existing marks when exam/class/section/subject changes
    useEffect(() => {
        if (!user || !examId || !selectedClass || !selectedSection || !selectedSubject || students.length === 0) return;

        setLoading(true);

        console.log('Loading marks for:', { examId, selectedClass, selectedSection, selectedSubject });

        // Fetch existing results for this exam/class/section
        fetch(`${API_URL}/api/exams/results?exam_id=${examId}&class_id=${selectedClass}&section_id=${selectedSection}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(results => {
                console.log('Results received:', results);

                // Extract marks for the selected subject
                const existingMarks = {};

                results.forEach(result => {
                    console.log('Processing result for student:', result.student_id);

                    const subjectData = result.subjects.find(s => s.subject_name === selectedSubject);
                    if (subjectData) {
                        // Handle both populated and non-populated student_id
                        const studentId = result.student_id._id || result.student_id;
                        existingMarks[studentId] = subjectData.obtained_marks;

                        console.log(`Found marks for student ${studentId}:`, subjectData.obtained_marks);

                        // Also update total marks if available
                        if (subjectData.total_marks) {
                            setTotalMarks(subjectData.total_marks);
                        }
                    }
                });

                console.log('Setting marks:', existingMarks);
                setMarks(existingMarks);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading marks:', err);
                setMarks({}); // Clear marks on error
                setLoading(false);
            });
    }, [examId, selectedClass, selectedSection, selectedSubject, students, user, classes]);

    const handleMarkChange = (studentId, val) => {
        setMarks(prev => ({ ...prev, [studentId]: val }));
    };

    const handleSave = async () => {
        if (!examId || !selectedClass || !selectedSection || !selectedSubject) {
            return alert('Please select Exam, Class, Section, and Subject');
        }

        setSaving(true);
        const marksData = students.map(s => ({
            student_id: s._id,
            obtained_marks: Number(marks[s._id] || 0),
            total_marks: Number(totalMarks)
        }));

        try {
            const res = await fetch(`${API_URL}/api/exams/marks`, {
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
            alert(data.message || 'Marks saved successfully!');
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
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Marks Entry</h1>

            {/* Selection Controls */}
            <div className="bg-white p-6 rounded shadow mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Exam</label>
                        <select
                            value={examId}
                            onChange={e => setExamId(e.target.value)}
                            className="w-full border p-2 rounded"
                        >
                            {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Class</label>
                        <select
                            value={selectedClass}
                            onChange={e => {
                                const classId = e.target.value;
                                setSelectedClass(classId);
                                const cls = classes.find(c => c._id === classId);
                                if (cls && cls.sections.length > 0) setSelectedSection(cls.sections[0]);
                                // Fetch subjects for new class
                                fetchClassSubjects(classId);
                            }}
                            className="w-full border p-2 rounded"
                        >
                            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Section</label>
                        <select
                            value={selectedSection}
                            onChange={e => setSelectedSection(e.target.value)}
                            className="w-full border p-2 rounded"
                        >
                            {classes.find(c => c._id === selectedClass)?.sections.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            )) || <option value="A">A</option>}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={e => {
                                const subjectName = e.target.value;
                                setSelectedSubject(subjectName);
                                // Auto-load total marks from subject
                                const subject = classSubjects.find(s => s.name === subjectName);
                                if (subject) {
                                    setTotalMarks(subject.total_marks);
                                }
                            }}
                            className="w-full border p-2 rounded"
                            disabled={classSubjects.length === 0}
                        >
                            {classSubjects.length === 0 ? (
                                <option value="">No subjects assigned to this class</option>
                            ) : (
                                classSubjects.map(sub => (
                                    <option key={sub._id} value={sub.name}>
                                        {sub.name} ({sub.total_marks} marks)
                                    </option>
                                ))
                            )}
                        </select>
                        {classSubjects.length === 0 && (
                            <p className="text-sm text-red-600 mt-1">
                                Please assign subjects to this class in Subject Management
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Total Marks</label>
                        <input
                            type="number"
                            value={totalMarks}
                            onChange={e => setTotalMarks(e.target.value)}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Marks'}
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            )}

            {/* Marks Entry Table */}
            {!loading && students.length > 0 && (
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">#</th>
                                <th className="p-3 text-left">Roll No</th>
                                <th className="p-3 text-left">Student Name</th>
                                <th className="p-3 text-center">Obtained Marks (out of {totalMarks})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student._id} className="border-t hover:bg-gray-50">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3 font-semibold">{student.roll_no}</td>
                                    <td className="p-3">{student.full_name}</td>
                                    <td className="p-3">
                                        <input
                                            id={`mark-input-${index}`}
                                            type="number"
                                            min="0"
                                            max={totalMarks}
                                            value={marks[student._id] || ''}
                                            onChange={e => handleMarkChange(student._id, e.target.value)}
                                            onKeyDown={e => handleKeyDown(e, index)}
                                            className="w-full border p-2 rounded text-center font-bold text-lg"
                                            placeholder="0"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!loading && students.length === 0 && (
                <div className="bg-white rounded shadow p-8 text-center text-gray-500">
                    <p>No students found for the selected class and section.</p>
                    <p className="text-sm mt-2">Please select a different class or section.</p>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">Instructions:</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Select Exam, Class, Section, and Subject</li>
                    <li>Existing marks will load automatically if available</li>
                    <li>Enter marks for each student (press Enter to move to next)</li>
                    <li>Click "Save Marks" to save all entries</li>
                    <li>You can edit and re-save marks anytime</li>
                </ul>
            </div>
        </div>
    );
};

export default MarksEntry;
