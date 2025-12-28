import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const MarksEntry = () => {
    const { user } = useContext(AuthContext);
    const { t } = useTranslation(['exams', 'common']);
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

    // Fetch students when class/section/subject changes
    useEffect(() => {
        if (!user || !selectedClass || !selectedSection || !selectedSubject) return;

        // Get class name from selected class ID
        const classData = classes.find(c => c._id === selectedClass);
        if (!classData) return;

        // Find the selected subject's ID from classSubjects
        const subjectData = classSubjects.find(s => s.name === selectedSubject);
        if (!subjectData) {
            console.warn('Subject not found in classSubjects');
            setStudents([]);
            return;
        }

        setLoading(true);

        console.log(`📚 Fetching students enrolled in ${selectedSubject} (${subjectData._id}) for ${classData.name}-${selectedSection}`);

        // Use the subject-filtered endpoint
        fetch(`${API_URL}/api/students/list/by-subject?class_id=${classData.name}&section_id=${selectedSection}&subject_id=${subjectData._id}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                console.log(`✅ Found ${data.length} students enrolled in ${selectedSubject}`);
                setStudents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching students by subject:', err);
                setStudents([]);
                setLoading(false);
            });
    }, [selectedClass, selectedSection, selectedSubject, user, classes, classSubjects]);

    // Load existing marks when exam/class/section/subject changes
    useEffect(() => {
        if (!user || !examId || !selectedClass || !selectedSection || !selectedSubject || students.length === 0) return;

        setLoading(true);

        // Get class name from selected class ID
        const classData = classes.find(c => c._id === selectedClass);
        if (!classData) {
            setLoading(false);
            return;
        }

        console.log('Loading marks for:', { examId, className: classData.name, selectedSection, selectedSubject });

        // Fetch existing results for this exam/class/section - use class NAME not ObjectId
        fetch(`${API_URL}/api/exams/results?exam_id=${examId}&class_id=${classData.name}&section_id=${selectedSection}`, {
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
        // Convert to number
        const numValue = Number(val);
        const maxMarks = Number(totalMarks);

        // Validate: must be between 0 and totalMarks
        if (val === '' || val === null) {
            // Allow empty input
            setMarks(prev => ({ ...prev, [studentId]: '' }));
            return;
        }

        // Check if it's a valid number
        if (isNaN(numValue)) {
            alert('Please enter a valid number');
            return;
        }

        // Check if it's negative
        if (numValue < 0) {
            alert('Marks cannot be negative!');
            return;
        }

        // Check if it exceeds total marks
        if (numValue > maxMarks) {
            alert(`Obtained marks (${numValue}) cannot be more than total marks (${maxMarks})!`);
            return;
        }

        // Valid input - update marks
        setMarks(prev => ({ ...prev, [studentId]: val }));
    };

    const handleSave = async () => {
        if (!examId || !selectedClass || !selectedSection || !selectedSubject) {
            return alert('Please select Exam, Class, Section, and Subject');
        }

        // Validate all marks before saving
        const maxMarks = Number(totalMarks);
        const invalidMarks = [];

        students.forEach(s => {
            const mark = Number(marks[s._id] || 0);
            if (mark < 0 || mark > maxMarks) {
                invalidMarks.push({
                    name: s.full_name,
                    roll: s.roll_no,
                    marks: mark
                });
            }
        });

        if (invalidMarks.length > 0) {
            const errorMsg = invalidMarks.map(im =>
                `${im.name} (${im.roll}): ${im.marks} marks`
            ).join('\n');
            alert(`Invalid marks detected! Marks must be between 0 and ${maxMarks}:\n\n${errorMsg}`);
            return;
        }

        setSaving(true);

        // Get class name from selected class ID
        const classData = classes.find(c => c._id === selectedClass);
        if (!classData) {
            alert('Class not found');
            setSaving(false);
            return;
        }

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
                    class_id: classData.name, // Send class NAME, not ObjectId
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
        <div className="max-w-6xl mx-auto p-3 sm:p-4">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('exams:marks.title')}</h1>

            {/* Selection Controls */}
            <div className="bg-white p-4 sm:p-6 rounded shadow mb-4 sm:mb-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">{t('exams:marks.examLabel')}</label>
                        <select
                            value={examId}
                            onChange={e => setExamId(e.target.value)}
                            className="w-full border p-2 rounded text-sm sm:text-base"
                        >
                            {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">{t('common:common.class', 'Class')}</label>
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
                            className="w-full border p-2 rounded text-sm sm:text-base"
                        >
                            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">{t('common:common.section', 'Section')}</label>
                        <select
                            value={selectedSection}
                            onChange={e => setSelectedSection(e.target.value)}
                            className="w-full border p-2 rounded text-sm sm:text-base"
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
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">Total Marks</label>
                        <input
                            type="number"
                            value={totalMarks}
                            onChange={e => setTotalMarks(e.target.value)}
                            className="w-full border p-2 rounded text-sm sm:text-base"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2 rounded flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base w-full sm:w-auto justify-center"
                    >
                        <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
                        {saving ? t('common:app.loading') : t('common:save')}
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
                <div className="bg-white rounded shadow overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">#</th>
                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">Roll No</th>
                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">Student Name</th>
                                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm">Obtained Marks (out of {totalMarks})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student._id} className="border-t hover:bg-gray-50">
                                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{index + 1}</td>
                                    <td className="p-2 sm:p-3 font-semibold text-xs sm:text-sm">{student.roll_no}</td>
                                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{student.full_name}</td>
                                    <td className="p-2 sm:p-3">
                                        <input
                                            id={`mark-input-${index}`}
                                            type="number"
                                            min="0"
                                            max={totalMarks}
                                            value={marks[student._id] || ''}
                                            onChange={e => handleMarkChange(student._id, e.target.value)}
                                            onKeyDown={e => handleKeyDown(e, index)}
                                            className="w-full border p-1.5 sm:p-2 rounded text-center font-bold text-base sm:text-lg"
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
            {!loading && students.length === 0 && selectedSubject && (
                <div className="bg-white rounded shadow p-8 text-center">
                    <div className="text-yellow-600 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                        No students enrolled in <strong>{selectedSubject}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                        {classes.find(c => c._id === selectedClass)?.name} - {selectedSection}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded p-4 text-left">
                        <p className="font-semibold text-blue-900 mb-2">To fix this:</p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Go to <strong>Bulk Subject Assignment</strong> page</li>
                            <li>Select this class and section</li>
                            <li>Assign <strong>{selectedSubject}</strong> to the students</li>
                            <li>Return here to enter marks</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-4 sm:mt-6 bg-blue-50 p-3 sm:p-4 rounded border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2 text-sm sm:text-base">Instructions:</h3>
                <ul className="text-xs sm:text-sm text-blue-700 space-y-1 list-disc list-inside">
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
