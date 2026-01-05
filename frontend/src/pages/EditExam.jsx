import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const EditExam = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        is_active: true,
        exam_type: 'Mid-Term',
        subjects: [] // Array of { class_id, sections: [], subject_list: [] }
    });
    const [showClassSelector, setShowClassSelector] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState([]); // Temp for bulk add

    useEffect(() => {
        if (!user) return;
        fetchExam();
        fetchClasses();
        fetchSubjects();
    }, [id, user]);

    const fetchExam = async () => {
        try {
            const res = await fetch(`${API_URL}/api/exams`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const exams = await res.json();
            const exam = exams.find(e => e._id === id);

            if (exam) {
                // Ensure sections array exists for backward compatibility
                const processedSubjects = (exam.subjects || []).map(subject => ({
                    ...subject,
                    sections: subject.sections || [] // Ensure sections exist
                }));

                setFormData({
                    title: exam.title || '',
                    start_date: exam.start_date ? exam.start_date.split('T')[0] : '',
                    end_date: exam.end_date ? exam.end_date.split('T')[0] : '',
                    is_active: exam.is_active !== undefined ? exam.is_active : true,
                    exam_type: exam.exam_type || 'Mid-Term',
                    subjects: processedSubjects
                });
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching exam:', error);
            alert('Failed to load exam');
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await fetch(`${API_URL}/api/subjects`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addClass = () => {
        setShowClassSelector(true);
    };

    const addSelectedClasses = async () => {
        if (selectedClasses.length === 0) {
            alert('Please select at least one class');
            return;
        }

        // Fetch subjects for all selected classes
        const classSubjectsMap = {};
        for (const classId of selectedClasses) {
            try {
                const res = await fetch(`${API_URL}/api/subjects/class/${classId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const classSubjects = await res.json();
                classSubjectsMap[classId] = classSubjects;
            } catch (error) {
                console.error(`Error fetching subjects for class ${classId}:`, error);
                classSubjectsMap[classId] = [];
            }
        }

        setFormData(prev => {
            const newSubjects = [...prev.subjects];

            selectedClasses.forEach(classId => {
                // Check if class already exists
                if (!newSubjects.find(s => s.class_id === classId)) {
                    const cls = classes.find(c => c._id === classId);
                    const classSubjects = classSubjectsMap[classId] || [];

                    // Auto-populate subjects from class configuration
                    const autoLoadedSubjects = classSubjects.map(sub => ({
                        subject_name: sub.name,
                        total_marks: sub.total_marks || 100,
                        passing_percentage: 33,
                        passing_marks: 33,
                        theory_marks: 0,
                        practical_marks: 0
                    }));

                    newSubjects.push({
                        class_id: cls.name,
                        sections: cls.sections || ['A'], // Default to all sections
                        subject_list: autoLoadedSubjects
                    });
                }
            });

            return { ...prev, subjects: newSubjects };
        });

        setSelectedClasses([]);
        setShowClassSelector(false);
    };

    const toggleClassSection = (classIndex, section) => {
        setFormData(prev => {
            const newSubjects = [...prev.subjects];
            const sections = newSubjects[classIndex].sections || [];

            if (sections.includes(section)) {
                newSubjects[classIndex].sections = sections.filter(s => s !== section);
            } else {
                newSubjects[classIndex].sections = [...sections, section];
            }

            return { ...prev, subjects: newSubjects };
        });
    };

    const removeClass = (index) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.filter((_, i) => i !== index)
        }));
    };

    const updateClassId = (index, classId) => {
        setFormData(prev => {
            const newSubjects = [...prev.subjects];
            newSubjects[index].class_id = classId;
            return { ...prev, subjects: newSubjects };
        });
    };

    const addSubject = (classIndex) => {
        setFormData(prev => {
            const newSubjects = [...prev.subjects];
            newSubjects[classIndex].subject_list.push({
                subject_name: subjects[0]?.name || '',
                total_marks: 100,
                passing_percentage: 33,
                passing_marks: 33,
                theory_marks: 0,
                practical_marks: 0
            });
            return { ...prev, subjects: newSubjects };
        });
    };

    const removeSubject = (classIndex, subjectIndex) => {
        setFormData(prev => {
            const newSubjects = [...prev.subjects];
            newSubjects[classIndex].subject_list = newSubjects[classIndex].subject_list.filter((_, i) => i !== subjectIndex);
            return { ...prev, subjects: newSubjects };
        });
    };

    const updateSubject = (classIndex, subjectIndex, field, value) => {
        setFormData(prev => {
            const newSubjects = [...prev.subjects];
            newSubjects[classIndex].subject_list[subjectIndex][field] = value;

            // Auto-calculate passing marks when percentage or total marks changes
            if (field === 'passing_percentage' || field === 'total_marks') {
                const subject = newSubjects[classIndex].subject_list[subjectIndex];
                const percentage = field === 'passing_percentage' ? value : (subject.passing_percentage || 33);
                const totalMarks = field === 'total_marks' ? value : (subject.total_marks || 100);
                newSubjects[classIndex].subject_list[subjectIndex].passing_marks = Math.round((percentage / 100) * totalMarks);
            }

            return { ...prev, subjects: newSubjects };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`${API_URL}/api/exams/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('Exam updated successfully!');
                navigate('/exams');
            } else {
                const data = await res.json();
                alert(`Failed to update exam: ${data.message}`);
            }
        } catch (error) {
            console.error('Error updating exam:', error);
            alert('Failed to update exam');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading exam data...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Edit Exam</h1>
                    <button
                        onClick={() => navigate('/exams')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        <ArrowLeft size={18} />
                        Back to Exams
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h2 className="text-xl font-bold text-blue-700 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Exam Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Exam Type *</label>
                                <select
                                    name="exam_type"
                                    value={formData.exam_type}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="Mid-Term">Mid-Term</option>
                                    <option value="Final">Final</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quiz">Quiz</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">
                                        Mark as Active (Results can be generated)
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Subject Configuration */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-purple-700">Subject Configuration</h2>
                            <button
                                type="button"
                                onClick={addClass}
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                            >
                                <Plus size={18} />
                                Add Classes
                            </button>
                        </div>

                        {/* Bulk Class Selector Modal */}
                        {showClassSelector && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
                                    <h3 className="text-lg font-bold mb-4">Select Classes for this Exam</h3>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {classes.map(cls => (
                                            <label key={cls._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedClasses.includes(cls._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedClasses([...selectedClasses, cls._id]);
                                                        } else {
                                                            setSelectedClasses(selectedClasses.filter(id => id !== cls._id));
                                                        }
                                                    }}
                                                    className="w-5 h-5"
                                                />
                                                <span className="font-semibold">{cls.name}</span>
                                                <span className="text-sm text-gray-500">({cls.sections.join(', ')})</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowClassSelector(false);
                                                setSelectedClasses([]);
                                            }}
                                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addSelectedClasses}
                                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                        >
                                            Add Selected Classes ({selectedClasses.length})
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.subjects.length === 0 && (
                            <div className="bg-gray-50 p-6 rounded border-2 border-dashed border-gray-300 text-center text-gray-500">
                                <p>No classes configured yet.</p>
                                <p className="text-sm mt-1">Click "Add Class" to configure subjects and passing marks.</p>
                            </div>
                        )}

                        {formData.subjects.map((classConfig, classIndex) => (
                            <div key={classIndex} className="bg-gray-50 p-4 rounded border mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <label className="text-sm font-semibold text-gray-700">Class:</label>
                                        <span className="font-bold text-lg">{classConfig.class_id}</span>

                                        {/* Section Selector */}
                                        <div className="flex items-center gap-2 ml-4">
                                            <label className="text-sm font-semibold text-gray-600">Sections:</label>
                                            {classes.find(c => c.name === classConfig.class_id)?.sections.map(section => {
                                                const isSelected = (classConfig.sections || []).includes(section);
                                                return (
                                                    <button
                                                        key={section}
                                                        type="button"
                                                        onClick={() => toggleClassSection(classIndex, section)}
                                                        className={`px-3 py-1 rounded text-sm font-semibold ${isSelected
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        {section}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => addSubject(classIndex)}
                                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 ml-auto"
                                        >
                                            <Plus size={14} />
                                            Add Subject
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeClass(classIndex)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                                        title="Remove Class"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {(classConfig.sections || []).length === 0 && (
                                    <p className="text-sm text-yellow-600 italic mb-2">⚠️ No sections selected! Please select at least one section.</p>
                                )}

                                {classConfig.subject_list.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No subjects added yet.</p>
                                )}

                                {classConfig.subject_list.map((subject, subjectIndex) => (
                                    <div key={subjectIndex} className="bg-white p-3 rounded border mb-2">
                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                                                <select
                                                    value={subject.subject_name}
                                                    onChange={(e) => updateSubject(classIndex, subjectIndex, 'subject_name', e.target.value)}
                                                    className="w-full p-2 border rounded text-sm"
                                                >
                                                    {subjects.map(sub => (
                                                        <option key={sub._id} value={sub.name}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Marks</label>
                                                <input
                                                    type="number"
                                                    value={subject.total_marks}
                                                    onChange={(e) => updateSubject(classIndex, subjectIndex, 'total_marks', Number(e.target.value))}
                                                    className="w-full p-2 border rounded text-sm"
                                                    min="0"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Passing %</label>
                                                <input
                                                    type="number"
                                                    value={subject.passing_percentage || 33}
                                                    onChange={(e) => updateSubject(classIndex, subjectIndex, 'passing_percentage', Number(e.target.value))}
                                                    className="w-full p-2 border rounded text-sm"
                                                    min="0"
                                                    max="100"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    = {Math.round(((subject.passing_percentage || 33) / 100) * subject.total_marks)} marks
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Theory Marks</label>
                                                <input
                                                    type="number"
                                                    value={subject.theory_marks}
                                                    onChange={(e) => updateSubject(classIndex, subjectIndex, 'theory_marks', Number(e.target.value))}
                                                    className="w-full p-2 border rounded text-sm"
                                                    min="0"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Practical Marks</label>
                                                <input
                                                    type="number"
                                                    value={subject.practical_marks}
                                                    onChange={(e) => updateSubject(classIndex, subjectIndex, 'practical_marks', Number(e.target.value))}
                                                    className="w-full p-2 border rounded text-sm"
                                                    min="0"
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubject(classIndex, subjectIndex)}
                                                    className="w-full text-red-600 hover:bg-red-50 p-2 rounded text-sm"
                                                    title="Remove Subject"
                                                >
                                                    <Trash2 size={16} className="mx-auto" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => navigate('/exams')}
                            className="px-6 py-3 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            <Save size={20} />
                            {saving ? 'Saving...' : 'Update Exam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditExam;
