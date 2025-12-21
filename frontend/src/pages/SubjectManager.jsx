import { useState, useEffect, useContext } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Check, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const SubjectManager = () => {
    const { user } = useContext(AuthContext);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        total_marks: 100
    });

    // Assignment state
    const [selectedClass, setSelectedClass] = useState('');
    const [assignedSubjects, setAssignedSubjects] = useState([]);

    useEffect(() => {
        if (user) {
            fetchSubjects();
            fetchClasses();
        }
    }, [user]);

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

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setClasses(data);
            if (data.length > 0) {
                setSelectedClass(data[0]._id);
                setAssignedSubjects(data[0].subjects?.map(s => s._id || s) || []);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingId
                ? `${API_URL}/api/subjects/${editingId}`
                : `${API_URL}/api/subjects`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert(editingId ? 'Subject updated!' : 'Subject created!');
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: '', code: '', total_marks: 100 });
                fetchSubjects();
            }
        } catch (error) {
            alert('Error saving subject');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (subject) => {
        setFormData({
            name: subject.name,
            code: subject.code || '',
            total_marks: subject.total_marks
        });
        setEditingId(subject._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this subject?')) return;

        try {
            await fetch(`${API_URL}/api/subjects/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Subject deleted');
            fetchSubjects();
        } catch (error) {
            alert('Error deleting subject');
        }
    };

    const handleSeedSubjects = async () => {
        if (!confirm('This will create default subjects (Pre-Medical, Engineering, ICS). Continue?')) return;

        try {
            const res = await fetch(`${API_URL}/api/subjects/seed`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            alert(data.message);
            fetchSubjects();
        } catch (error) {
            alert('Error seeding subjects');
        }
    };

    const handleClassChange = (classId) => {
        setSelectedClass(classId);
        const classData = classes.find(c => c._id === classId);
        setAssignedSubjects(classData?.subjects?.map(s => s._id || s) || []);
    };

    const toggleSubjectAssignment = (subjectId) => {
        setAssignedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const saveAssignment = async () => {
        try {
            await fetch(`${API_URL}/api/classes/${selectedClass}/subjects`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ subjects: assignedSubjects })
            });
            alert('Subjects assigned successfully!');
            fetchClasses();
        } catch (error) {
            alert('Error assigning subjects');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Subject Management</h1>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditingId(null);
                        setFormData({ name: '', code: '', total_marks: 100 });
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Subject
                </button>
                <button
                    onClick={handleSeedSubjects}
                    className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
                >
                    <BookOpen size={20} />
                    Seed Default Subjects
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject List */}
                <div className="bg-white rounded shadow p-6">
                    <h2 className="text-xl font-bold mb-4">All Subjects ({subjects.length})</h2>

                    {subjects.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No subjects yet. Add one or seed defaults.</p>
                    ) : (
                        <div className="space-y-2">
                            {subjects.map(subject => (
                                <div key={subject._id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                                    <div>
                                        <div className="font-semibold">{subject.name}</div>
                                        <div className="text-sm text-gray-600">
                                            {subject.code && `Code: ${subject.code} | `}
                                            Total Marks: {subject.total_marks}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(subject)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subject._id)}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Assign Subjects to Classes */}
                <div className="bg-white rounded shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Assign Subjects to Classes</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Select Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => handleClassChange(e.target.value)}
                            className="w-full border p-2 rounded"
                        >
                            {classes.map(cls => (
                                <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Select Subjects</label>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {subjects.map(subject => (
                                <label key={subject._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={assignedSubjects.includes(subject._id)}
                                        onChange={() => toggleSubjectAssignment(subject._id)}
                                        className="w-4 h-4"
                                    />
                                    <span>{subject.name}</span>
                                    <span className="text-sm text-gray-500">({subject.total_marks} marks)</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={saveAssignment}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Save Assignment
                    </button>
                </div>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            {editingId ? 'Edit Subject' : 'Add New Subject'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Subject Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border p-2 rounded"
                                    placeholder="e.g., Biology, Physics"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Subject Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full border p-2 rounded"
                                    placeholder="e.g., BIO, PHY"
                                    maxLength={10}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Total Marks *</label>
                                <input
                                    type="number"
                                    value={formData.total_marks}
                                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                                    className="w-full border p-2 rounded"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectManager;
