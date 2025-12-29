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
        subjects: [] // Array of { class_id, subject_list: [{ subject_name, total_marks, passing_marks, theory_marks, practical_marks }] }
    });

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
                setFormData({
                    title: exam.title || '',
                    start_date: exam.start_date ? exam.start_date.split('T')[0] : '',
                    end_date: exam.end_date ? exam.end_date.split('T')[0] : '',
                    is_active: exam.is_active !== undefined ? exam.is_active : true,
                    exam_type: exam.exam_type || 'Mid-Term',
                    subjects: exam.subjects || []
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
        setFormData(prev => ({
            ...prev,
            subjects: [...prev.subjects, {
                class_id: classes[0]?.name || '',
                subject_list: []
            }]
        }));
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
                                Add Class
                            </button>
                        </div>

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
                                        <select
                                            value={classConfig.class_id}
                                            onChange={(e) => updateClassId(classIndex, e.target.value)}
                                            className="p-2 border rounded"
                                        >
                                            {classes.map(cls => (
                                                <option key={cls._id} value={cls.name}>{cls.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => addSubject(classIndex)}
                                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
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
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Passing Marks</label>
                                                <input
                                                    type="number"
                                                    value={subject.passing_marks}
                                                    onChange={(e) => updateSubject(classIndex, subjectIndex, 'passing_marks', Number(e.target.value))}
                                                    className="w-full p-2 border rounded text-sm"
                                                    min="0"
                                                    max={subject.total_marks}
                                                />
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
