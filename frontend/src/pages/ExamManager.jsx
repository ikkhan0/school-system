import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calendar, CheckCircle, XCircle, Edit } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const ExamManager = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [exams, setExams] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        is_active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) fetchExams();
    }, [user]);

    const fetchExams = async () => {
        // Fetch ALL exams (not just active) for management
        // Adjust backend if needed to allow fetching all, or filter client side if backend returns all
        // For now assuming GET /api/exams returns active. We might need a new route or query param for "all"
        // Let's use the existing one and see. If it only returns active, we might need to update backend.
        // Actually, let's assume we want to see all.
        try {
            // We might need a different endpoint for "all" exams or just use this one.
            // If existing returns only active, we should fix that in backend first for this page.
            // Let's just fetch for now.
            const res = await fetch(`${API_URL}/api/exams`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setExams(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/exams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                alert("Exam Created Successfully!");
                setFormData({ title: '', start_date: '', end_date: '', is_active: true });
                fetchExams();
            } else {
                alert(data.message || "Failed to create exam");
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (examId, examTitle) => {
        if (!confirm(`Are you sure you want to delete "${examTitle}"?\n\nNote: This exam can only be deleted if no marks have been entered.`)) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/exams/${examId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();

            if (res.ok) {
                alert('Exam deleted successfully!');
                fetchExams();
            } else {
                alert(data.message || 'Failed to delete exam');
            }
        } catch (err) {
            alert('Error deleting exam: ' + err.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Exam Management</h1>

            {/* Create Exam Form */}
            <div className="bg-white p-4 sm:p-6 rounded shadow mb-6 sm:mb-8">
                <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <Plus size={18} className="sm:w-5 sm:h-5" /> Create New Exam
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Exam Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Monthly Test Dec 2025"
                            className="border p-2 rounded w-full"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-1">Start Date</label>
                            <input
                                type="date"
                                className="border p-2 rounded w-full"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-1">End Date</label>
                            <input
                                type="date"
                                className="border p-2 rounded w-full"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label htmlFor="isActive">Mark as Active (Results can be generated)</label>
                    </div>

                    <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-2 hover:bg-blue-700">
                        {loading ? 'Creating...' : 'Create Exam'}
                    </button>
                </form>
            </div>

            {/* Existing Exams List */}
            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-lg font-bold mb-4 text-gray-700">Existing Exams</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-2">Title</th>
                                <th className="p-2">Dates</th>
                                <th className="p-2 text-center">Status</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.length === 0 ? (
                                <tr><td colSpan="4" className="p-4 text-center text-gray-500">No exams found.</td></tr>
                            ) : (
                                exams.map(exam => (
                                    <tr key={exam._id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{exam.title}</td>
                                        <td className="p-2 text-sm text-gray-600">
                                            {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-2 text-center">
                                            {exam.is_active ?
                                                <span className="text-green-600 flex justify-center items-center gap-1"><CheckCircle size={16} /> Active</span> :
                                                <span className="text-gray-400 flex justify-center items-center gap-1"><XCircle size={16} /> Inactive</span>
                                            }
                                        </td>
                                        <td className="p-2 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/exams/edit/${exam._id}`)}
                                                    className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                                                    title="Edit Exam"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exam._id, exam.title)}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                    title="Delete Exam"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExamManager;
