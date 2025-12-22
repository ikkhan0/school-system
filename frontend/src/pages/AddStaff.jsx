import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
import API_URL from '../config';

const AddStaff = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        employee_id: '',
        cnic: '',
        dob: '',
        gender: '',
        mobile: '',
        email: '',
        current_address: '',
        city: '',
        blood_group: '',
        religion: '',
        designation: '',
        department: '',
        joining_date: '',
        employment_type: 'Permanent',
        basic_salary: '',
        bank_name: '',
        account_number: '',
        emergency_contact_name: '',
        emergency_contact_mobile: '',
        photo: null,
        assigned_subjects: [],
        assigned_classes: []
    });

    useEffect(() => {
        if (!user) return;
        fetchSubjects();
    }, [user]);

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
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubjectToggle = (subjectId) => {
        setFormData(prev => ({
            ...prev,
            assigned_subjects: prev.assigned_subjects.includes(subjectId)
                ? prev.assigned_subjects.filter(id => id !== subjectId)
                : [...prev.assigned_subjects, subjectId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'assigned_subjects' || key === 'assigned_classes') {
                    data.append(key, JSON.stringify(formData[key]));
                } else if (key === 'photo' && formData[key]) {
                    data.append(key, formData[key]);
                } else if (formData[key]) {
                    data.append(key, formData[key]);
                }
            });

            await axios.post(`${API_URL}/api/staff/add`, data, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Staff member added successfully!');
            navigate('/staff');
        } catch (error) {
            console.error('Error adding staff:', error);
            alert(`Failed to add staff: ${error.response?.data?.message || error.message}`);
        }
    };

    const designations = [
        'Principal', 'Vice Principal', 'Head Teacher', 'Senior Teacher', 'Teacher',
        'Subject Teacher', 'Class Teacher', 'Admin Officer', 'Accountant',
        'Librarian', 'Lab Assistant', 'Peon', 'Watchman', 'Cleaner', 'Driver', 'Other'
    ];

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Add New Staff Member</h1>
                    <button
                        onClick={() => navigate('/staff')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        <ArrowLeft size={18} />
                        Back to Staff
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h2 className="text-xl font-bold text-blue-700 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID *</label>
                                <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">CNIC *</label>
                                <input type="text" name="cnic" value={formData.cnic} onChange={handleChange} placeholder="12345-1234567-1" className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile *</label>
                                <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                                <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full p-2 border rounded">
                                    <option value="">Select</option>
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
                                <input type="text" name="religion" value={formData.religion} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                <textarea name="current_address" value={formData.current_address} onChange={handleChange} className="w-full p-2 border rounded" rows="2" />
                            </div>
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div>
                        <h2 className="text-xl font-bold text-green-700 mb-4">Employment Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Designation *</label>
                                <select name="designation" value={formData.designation} onChange={handleChange} className="w-full p-2 border rounded" required>
                                    <option value="">Select Designation</option>
                                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
                                <select name="department" value={formData.department} onChange={handleChange} className="w-full p-2 border rounded" required>
                                    <option value="">Select Department</option>
                                    <option value="Academic">Academic</option>
                                    <option value="Administration">Administration</option>
                                    <option value="Support">Support</option>
                                    <option value="Management">Management</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Type</label>
                                <select name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full p-2 border rounded">
                                    <option value="Permanent">Permanent</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Part-Time">Part-Time</option>
                                    <option value="Visiting">Visiting</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Joining Date *</label>
                                <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Basic Salary *</label>
                                <input type="number" name="basic_salary" value={formData.basic_salary} onChange={handleChange} placeholder="Enter basic salary" className="w-full p-2 border rounded" required />
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                        <h2 className="text-xl font-bold text-purple-700 mb-4">Bank Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Name</label>
                                <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Account Number</label>
                                <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                        <h2 className="text-xl font-bold text-red-700 mb-4">Emergency Contact</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Name</label>
                                <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Mobile</label>
                                <input type="text" name="emergency_contact_mobile" value={formData.emergency_contact_mobile} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Photo</h2>
                        <input type="file" name="photo" onChange={handleChange} accept="image/*" className="w-full p-2 border rounded bg-white" />
                    </div>

                    {/* Subject Assignment (for teachers/academic staff only) */}
                    {subjects.length > 0 && (
                        formData.designation === 'Teacher' ||
                        formData.designation === 'Subject Teacher' ||
                        formData.designation === 'Class Teacher' ||
                        formData.designation === 'Senior Teacher' ||
                        formData.designation === 'Head Teacher'
                    ) && (
                            <div>
                                <h2 className="text-xl font-bold text-blue-700 mb-4">
                                    Assign Subjects ({formData.assigned_subjects.length} selected)
                                </h2>
                                <p className="text-sm text-gray-600 mb-3">Select subjects this teacher will teach</p>
                                <div className="border rounded p-4 bg-gray-50">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {subjects.map(subject => (
                                            <label key={subject._id} className="flex items-center space-x-2 p-2 hover:bg-white rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.assigned_subjects.includes(subject._id)}
                                                    onChange={() => handleSubjectToggle(subject._id)}
                                                    className="w-4 h-4 text-blue-600 rounded"
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
                        <button type="button" onClick={() => navigate('/staff')} className="px-6 py-3 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                            Cancel
                        </button>
                        <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
                            <Save size={20} />
                            Save Staff Member
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStaff;
