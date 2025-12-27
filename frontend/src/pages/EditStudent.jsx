import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
import API_URL from '../config';

const EditStudent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        full_name: '',
        father_name: '',
        father_mobile: '',
        father_cnic: '',
        dob: '',
        gender: '',
        address: '',
        roll_no: '',
        class_id: '',
        section_id: '',
        monthly_fee: '',
        concession: '',
        mother_name: '',
        mother_mobile: '',
        mother_cnic: '',
        student_cnic: '',
        emergency_contact: '',
        blood_group: '',
        religion: '',
        city: '',
        admission_date: '',
        previous_school: '',
        medical_conditions: '',
        allergies: '',
        image: null,
        subjects: []
    });

    useEffect(() => {
        if (!user) return;
        fetchStudent();
        fetchClasses();
        fetchSubjects();
    }, [id, user]);

    const fetchStudent = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/students/${id}/profile`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const student = response.data;

            // Populate form with existing data
            setFormData({
                full_name: student.full_name || '',
                father_name: student.father_name || '',
                father_mobile: student.father_mobile || student.family_id?.father_mobile || '',
                father_cnic: student.family_id?.father_cnic || '',
                dob: student.dob ? student.dob.split('T')[0] : '',
                gender: student.gender || '',
                address: student.address || student.current_address || '',
                roll_no: student.roll_no || '',
                class_id: student.class_id || '',
                section_id: student.section_id || '',
                monthly_fee: student.monthly_fee || '',
                concession: '',
                mother_name: student.mother_name || '',
                mother_mobile: student.mother_mobile || '',
                mother_cnic: student.mother_cnic || '',
                student_cnic: student.student_cnic || student.cnic || '',
                emergency_contact: student.emergency_contact || '',
                blood_group: student.blood_group || '',
                religion: student.religion || '',
                city: student.city || '',
                admission_date: student.admission_date ? student.admission_date.split('T')[0] : '',
                previous_school: student.previous_school || '',
                medical_conditions: student.medical_conditions || '',
                allergies: student.allergies || '',
                image: null,
                subjects: student.enrolled_subjects
                    ?.filter(es => es && es.subject_id && es.subject_id._id) // Filter out null/undefined
                    ?.map(es => es.subject_id._id) || []
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching student:', error);
            alert('Failed to load student data');
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/subjects`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSubjects(response.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else if (name.includes('cnic')) {
            // Auto-format CNIC: 00000-0000000-0
            const formatted = formatCNIC(value);
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const formatCNIC = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');

        // Format as 00000-0000000-0
        if (digits.length <= 5) {
            return digits;
        } else if (digits.length <= 12) {
            return `${digits.slice(0, 5)}-${digits.slice(5)}`;
        } else {
            return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
        }
    };

    const handleSubjectToggle = (subjectId) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.includes(subjectId)
                ? prev.subjects.filter(id => id !== subjectId)
                : [...prev.subjects, subjectId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'subjects') {
                    data.append(key, JSON.stringify(formData[key]));
                } else if (key === 'image' && formData[key]) {
                    data.append(key, formData[key]);
                } else if (formData[key]) {
                    data.append(key, formData[key]);
                }
            });

            await axios.put(`${API_URL}/api/students/${id}`, data, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Student updated successfully!');
            navigate(`/student-profile/${id}`);
        } catch (error) {
            console.error('Error updating student:', error);
            alert(`Failed to update student: ${error.response?.data?.message || error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading student data...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Edit Student</h1>
                    <button
                        onClick={() => navigate(`/student-profile/${id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        <ArrowLeft size={18} />
                        Back to Profile
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h2 className="text-xl font-bold text-blue-700 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Roll Number *</label>
                                <input
                                    type="text"
                                    name="roll_no"
                                    value={formData.roll_no}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Class *</label>
                                <select
                                    name="class_id"
                                    value={formData.class_id}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Section *</label>
                                <input
                                    type="text"
                                    name="section_id"
                                    value={formData.section_id}
                                    onChange={handleChange}
                                    placeholder="A/B/C"
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                                <select
                                    name="blood_group"
                                    value={formData.blood_group}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Religion</label>
                                <input
                                    type="text"
                                    name="religion"
                                    value={formData.religion}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Family Information */}
                    <div>
                        <h2 className="text-xl font-bold text-green-700 mb-4">Family Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Father Name *</label>
                                <input
                                    type="text"
                                    name="father_name"
                                    value={formData.father_name}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Father Mobile *</label>
                                <input
                                    type="text"
                                    name="father_mobile"
                                    value={formData.father_mobile}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Father CNIC</label>
                                <input
                                    type="text"
                                    name="father_cnic"
                                    value={formData.father_cnic}
                                    onChange={handleChange}
                                    placeholder="00000-0000000-0"
                                    maxLength="15"
                                    className="w-full p-2 border rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">Format: 00000-0000000-0</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mother Name</label>
                                <input
                                    type="text"
                                    name="mother_name"
                                    value={formData.mother_name}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mother Mobile</label>
                                <input
                                    type="text"
                                    name="mother_mobile"
                                    value={formData.mother_mobile}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mother CNIC</label>
                                <input
                                    type="text"
                                    name="mother_cnic"
                                    value={formData.mother_cnic}
                                    onChange={handleChange}
                                    placeholder="00000-0000000-0"
                                    maxLength="15"
                                    className="w-full p-2 border rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">Format: 00000-0000000-0</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Student CNIC / B-Form</label>
                                <input
                                    type="text"
                                    name="student_cnic"
                                    value={formData.student_cnic}
                                    onChange={handleChange}
                                    placeholder="00000-0000000-0"
                                    maxLength="15"
                                    className="w-full p-2 border rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">Student's CNIC or B-Form number</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact</label>
                                <input
                                    type="text"
                                    name="emergency_contact"
                                    value={formData.emergency_contact}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    rows="2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                        <h2 className="text-xl font-bold text-purple-700 mb-4">Academic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Fee</label>
                                <input
                                    type="number"
                                    name="monthly_fee"
                                    value={formData.monthly_fee}
                                    onChange={handleChange}
                                    placeholder="Enter monthly fee"
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Date</label>
                                <input
                                    type="date"
                                    name="admission_date"
                                    value={formData.admission_date}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Previous School</label>
                                <input
                                    type="text"
                                    name="previous_school"
                                    value={formData.previous_school}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medical Information */}
                    <div>
                        <h2 className="text-xl font-bold text-red-700 mb-4">Medical Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Medical Conditions</label>
                                <input
                                    type="text"
                                    name="medical_conditions"
                                    value={formData.medical_conditions}
                                    onChange={handleChange}
                                    placeholder="None"
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Allergies</label>
                                <input
                                    type="text"
                                    name="allergies"
                                    value={formData.allergies}
                                    onChange={handleChange}
                                    placeholder="None"
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Photo</h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Update Student Photo</label>
                            <input
                                type="file"
                                name="image"
                                onChange={handleChange}
                                accept="image/*"
                                className="w-full p-2 border rounded bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to keep current photo</p>
                        </div>
                    </div>

                    {/* Subject Selection */}
                    {subjects.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-blue-700 mb-4">
                                Update Subjects ({formData.subjects.length} selected)
                            </h2>
                            <div className="border rounded p-4 bg-gray-50">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {subjects.map(subject => (
                                        <label key={subject._id} className="flex items-center space-x-2 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-blue-300">
                                            <input
                                                type="checkbox"
                                                checked={formData.subjects.includes(subject._id)}
                                                onChange={() => handleSubjectToggle(subject._id)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{subject.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => navigate(`/student-profile/${id}`)}
                            className="px-6 py-3 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Save size={20} />
                            Update Student
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStudent;
