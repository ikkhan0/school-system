import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const Classes = () => {
    const { user } = useContext(AuthContext); // Get user/token
    const [classes, setClasses] = useState([]);
    const [newClassName, setNewClassName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/classes', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setClasses(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setLoading(false);
        }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        const sectionsInput = document.getElementById('newSections').value;
        const sections = sectionsInput.split(',').map(s => s.trim()).filter(s => s);

        try {
            await axios.post('http://localhost:5000/api/classes', {
                name: newClassName,
                sections: sections
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setNewClassName('');
            fetchClasses(); // Refresh list
        } catch (error) {
            console.error('Error adding class:', error);
            alert('Failed to add class');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Classes</h1>

            <div className="bg-white p-6 rounded shadow mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Class</h2>
                <form onSubmit={handleAddClass} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Class Name (e.g., Class 11)"
                        className="flex-1 p-2 border border-gray-300 rounded"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Sections (comma separated, e.g. A,B,C)"
                        className="flex-1 p-2 border border-gray-300 rounded"
                        id="newSections"
                        required
                    />
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                        Add Class
                    </button>
                </form>
            </div>

            <div className="bg-white rounded shadow text-gray-800">
                <h2 className="text-xl font-semibold p-6 border-b text-gray-700">Existing Classes</h2>
                {loading ? (
                    <p className="p-6">Loading...</p>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600">
                                <th className="p-4 border-b">Class Name</th>
                                <th className="p-4 border-b">Sections</th>
                                <th className="p-4 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((cls) => (
                                <tr key={cls._id} className="hover:bg-gray-50">
                                    <td className="p-4 border-b font-medium">{cls.name}</td>
                                    <td className="p-4 border-b">
                                        {cls.sections.map(sec => (
                                            <span key={sec} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                                                {sec}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="p-4 border-b">
                                        <button className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                                        <button className="text-red-600 hover:text-red-800">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Classes;
