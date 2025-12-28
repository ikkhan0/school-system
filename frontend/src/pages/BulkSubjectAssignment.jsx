import { useState, useEffect, useContext } from 'react';
import { Users, BookOpen, Save, AlertCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const BulkSubjectAssignment = () => {
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [selectedSubjects, setSelectedSubjects] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch classes
    useEffect(() => {
        if (!user) return;
        fetch(`${API_URL}/api/classes`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setClasses(data);
                if (data.length > 0) {
                    setSelectedClass(data[0]._id);
                    setSelectedSection(data[0].sections[0] || 'A');
                }
            })
            .catch(err => console.error('Error fetching classes:', err));
    }, [user]);

    // Fetch subjects for selected class
    useEffect(() => {
        if (!user || !selectedClass) return;
        fetch(`${API_URL}/api/subjects/class/${selectedClass}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => setSubjects(data))
            .catch(err => console.error('Error fetching subjects:', err));
    }, [user, selectedClass]);

    // Fetch students
    useEffect(() => {
        if (!user || !selectedClass || !selectedSection) return;

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
                console.error('Error fetching students:', err);
                setLoading(false);
            });
    }, [user, selectedClass, selectedSection, classes]);

    const toggleStudent = (studentId) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const toggleSubject = (subjectId) => {
        const newSelected = new Set(selectedSubjects);
        if (newSelected.has(subjectId)) {
            newSelected.delete(subjectId);
        } else {
            newSelected.add(subjectId);
        }
        setSelectedSubjects(newSelected);
    };

    const selectAllStudents = () => {
        if (selectedStudents.size === students.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(students.map(s => s._id)));
        }
    };

    const handleAssign = async () => {
        if (selectedStudents.size === 0) {
            return alert('Please select at least one student');
        }
        if (selectedSubjects.size === 0) {
            return alert('Please select at least one subject');
        }

        const confirmation = confirm(
            `Assign ${selectedSubjects.size} subject(s) to ${selectedStudents.size} student(s)?`
        );

        if (!confirmation) return;

        setSaving(true);

        const subjectIds = Array.from(selectedSubjects);
        const studentIds = Array.from(selectedStudents);

        try {
            const res = await fetch(`${API_URL}/api/students/bulk-assign-subjects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    student_ids: studentIds,
                    subject_ids: subjectIds
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`✅ ${data.message || 'Subjects assigned successfully!'}`);
                // Clear selections
                setSelectedStudents(new Set());
                setSelectedSubjects(new Set());
                // Refresh students to show updated subject assignments
                const classData = classes.find(c => c._id === selectedClass);
                if (classData) {
                    fetch(`${API_URL}/api/students/list?class_id=${classData.name}&section_id=${selectedSection}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    })
                        .then(res => res.json())
                        .then(data => setStudents(data));
                }
            } else {
                alert(`❌ ${data.message || 'Failed to assign subjects'}`);
            }
        } catch (error) {
            console.error('Error assigning subjects:', error);
            alert('Error assigning subjects');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen size={28} />
                    Bulk Subject Assignment
                </h1>
                <p className="text-gray-600 mt-1">Assign subjects to multiple students at once</p>
            </div>

            {/* Class/Section Selection */}
            <div className="bg-white p-6 rounded shadow mb-6">
                <h2 className="font-bold text-lg mb-4">Select Class & Section</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Class</label>
                        <select
                            value={selectedClass}
                            onChange={e => {
                                setSelectedClass(e.target.value);
                                const cls = classes.find(c => c._id === e.target.value);
                                if (cls && cls.sections.length > 0) setSelectedSection(cls.sections[0]);
                                setSelectedStudents(new Set());
                            }}
                            className="w-full border p-2 rounded"
                        >
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Section</label>
                        <select
                            value={selectedSection}
                            onChange={e => {
                                setSelectedSection(e.target.value);
                                setSelectedStudents(new Set());
                            }}
                            className="w-full border p-2 rounded"
                        >
                            {classes.find(c => c._id === selectedClass)?.sections.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            )) || <option value="A">A</option>}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Selection */}
                <div className="bg-white p-6 rounded shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <Users size={20} />
                            Select Students ({selectedStudents.size})
                        </h2>
                        <button
                            onClick={selectAllStudents}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {students.map(student => (
                                <label
                                    key={student._id}
                                    className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.has(student._id)}
                                        onChange={() => toggleStudent(student._id)}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold">{student.full_name}</div>
                                        <div className="text-sm text-gray-600">
                                            Roll No: {student.roll_no}
                                            {student.enrolled_subjects?.length > 0 && (
                                                <span className="ml-2 text-green-600">
                                                    • {student.enrolled_subjects.length} subject(s)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            ))}

                            {students.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    No students found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Subject Selection */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <BookOpen size={20} />
                        Select Subjects ({selectedSubjects.size})
                    </h2>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {subjects.map(subject => (
                            <label
                                key={subject._id}
                                className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSubjects.has(subject._id)}
                                    onChange={() => toggleSubject(subject._id)}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">{subject.name}</div>
                                    <div className="text-sm text-gray-600">
                                        Code: {subject.code} • {subject.total_marks} marks
                                    </div>
                                </div>
                            </label>
                        ))}

                        {subjects.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No subjects found for this class
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-6">
                <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="text-blue-600 mt-1" size={20} />
                    <div className="flex-1">
                        <h3 className="font-bold text-blue-900">Important Notes:</h3>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                            <li>• Selected subjects will be <strong>added</strong> to students' existing subjects</li>
                            <li>• If a student already has a subject, it will not be duplicated</li>
                            <li>• You can assign multiple subjects to multiple students at once</li>
                        </ul>
                    </div>
                </div>

                <button
                    onClick={handleAssign}
                    disabled={saving || selectedStudents.size === 0 || selectedSubjects.size === 0}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    {saving ? 'Assigning...' : `Assign ${selectedSubjects.size} Subject(s) to ${selectedStudents.size} Student(s)`}
                </button>
            </div>
        </div>
    );
};

export default BulkSubjectAssignment;
