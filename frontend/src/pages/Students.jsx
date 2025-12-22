import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Phone, MessageCircle, User, Edit, Trash2 } from 'lucide-react';
import API_URL from '../config';

const Students = () => {
    const { user } = useContext(AuthContext);
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [filterClass, setFilterClass] = useState('');

    // Form State
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
        monthly_fee: 5000,
        concession: 0,
        image: null, // File object
        subjects: [] // Array of subject IDs
    });

    useEffect(() => {
        if (!user) return;
        fetchStudents();
        fetchClasses();
        fetchSubjects();
    }, [user]);

    useEffect(() => {
        let result = students;
        if (filterClass) {
            result = result.filter(s => s.class_id === filterClass);
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.full_name.toLowerCase().includes(lower) ||
                s.roll_no.includes(lower)
            );
        }
        setFilteredStudents(result);
    }, [students, filterClass, searchTerm]);

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/students/list`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStudents(response.data);
            setFilteredStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
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
        if (e.target.name === 'image') {
            setFormData({ ...formData, image: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubjectToggle = (subjectId) => {
        setFormData(prev => {
            const subjects = prev.subjects.includes(subjectId)
                ? prev.subjects.filter(id => id !== subjectId)
                : [...prev.subjects, subjectId];
            return { ...prev, subjects };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'subjects') {
                    data.append(key, JSON.stringify(formData[key]));
                } else {
                    data.append(key, formData[key]);
                }
            });

            const response = await axios.post(`${API_URL}/api/students/add`, data, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { student, feeVoucher } = response.data;

            // Show success message with fee voucher option
            const printVoucher = window.confirm(
                `Student Added Successfully!\n\nFee Voucher Created:\nMonth: ${feeVoucher.month}\nAmount: Rs. ${feeVoucher.gross_amount}\n\nWould you like to print the fee voucher now?`
            );

            if (printVoucher) {
                // Open fee voucher in new window for printing
                window.open(`/fee-voucher/${student._id}/${feeVoucher.month}`, '_blank');
            }

            // Reset
            setFormData({
                full_name: '', father_name: '', father_mobile: '', father_cnic: '',
                dob: '', gender: '', address: '', roll_no: '', class_id: '', section_id: '',
                monthly_fee: 5000, concession: 0, image: null, subjects: []
            });
            fetchStudents();
        } catch (error) {
            console.error(error);
            alert('Failed to add student');
        }
    };

    const sendWhatsApp = (mobile) => {
        if (!mobile) return alert("No Mobile Number");
        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) num = '92' + num.substring(1);
        window.open(`https://wa.me/${num}`, '_blank');
    };

    const handleViewProfile = (student) => {

        navigate(`/student-profile/${student._id}`);
    };

    const handleEdit = (student) => {
        // Populate form with student data
        const enrolledSubjectIds = student.enrolled_subjects
            ?.filter(es => es.is_active)
            .map(es => es.subject_id?._id || es.subject_id) || [];

        setFormData({
            full_name: student.full_name,
            father_name: student.father_name || student.family_id?.father_name || '',
            father_mobile: student.father_mobile || student.family_id?.father_mobile || '',
            father_cnic: student.father_cnic || student.family_id?.father_cnic || '',
            dob: student.dob || '',
            gender: student.gender || '',
            address: student.address || '',
            roll_no: student.roll_no,
            class_id: student.class_id,
            section_id: student.section_id,
            monthly_fee: student.monthly_fee || 5000,
            image: null,
            subjects: enrolledSubjectIds
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (studentId, studentName) => {
        if (!confirm(`Are you sure you want to delete ${studentName}?`)) return;

        try {
            await axios.delete(`${API_URL}/api/students/${studentId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Failed to delete student');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header / Filters */}
            <div className={`bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center justify-between ${language === 'ur' ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-2xl font-bold uppercase text-blue-700">{t('students')}</h1>
                <div className="flex gap-2 flex-1 w-full justify-end">
                    <select className="border p-2 rounded" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            className="border p-2 rounded pl-8 w-full md:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-2 top-2.5 text-gray-400" size={18} />
                    </div>
                </div>
            </div>

            {/* Add Student Form (Collapsible or visible? Keeping visible top for now) */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 hidden">
                <h2 className="font-bold mb-4">{t('add_student')}</h2>
                {/* .. Form kept hidden for UI cleanliness, assuming Card View priority .. */}
                {/* Ideally this would be a Modal or a separate page, or a toggle. */}
                {/* For Phase 7 focus on List UI, I'll keep the logic but maybe collapse it. */}
                <p className="text-sm text-gray-500">Form collapsed for brevity in this view.</p>
            </div>

            {/* FAB to Toggle Form? Or just keep it separate. Let's add 'Add' button to header later. For now, focus on card view. */}

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map(student => (
                    <div key={student._id} className="bg-white rounded-xl shadow-lg border-l-4 border-blue-600 overflow-hidden transform hover:-translate-y-1 transition duration-200">
                        {/* Header */}
                        <div className="p-4 flex justify-between items-start border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 uppercase">{student.full_name}</h3>
                                <p className="text-xs text-gray-500 font-mono">{student.father_name}</p>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-2xl text-blue-800">{student.roll_no}</span>
                                <span className="text-[10px] uppercase text-gray-400">Roll No</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 flex gap-4">
                            {/* Image Placeholder */}
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow">
                                {student.image ? (
                                    <img src={`${API_URL}${student.image}`} alt={student.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-3 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('class')}:</span>
                                    <span className="font-semibold">{student.class_id} ({student.section_id})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('contact')}:</span>
                                    <span className="font-semibold text-xs">{student.family_id?.father_mobile || student.father_mobile}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Fee:</span>
                                    <span className="font-semibold">{student.monthly_fee}</span>
                                </div>
                                {student.enrolled_subjects && student.enrolled_subjects.length > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Subjects:</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                                {student.enrolled_subjects.filter(es => es.is_active).length}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subjects List (if any) */}
                        {student.enrolled_subjects && student.enrolled_subjects.filter(es => es.is_active).length > 0 && (
                            <div className="px-4 pb-3">
                                <div className="flex flex-wrap gap-1">
                                    {student.enrolled_subjects
                                        .filter(es => es.is_active)
                                        .slice(0, 4)
                                        .map((es, idx) => (
                                            <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                {es.subject_id?.name || 'N/A'}
                                            </span>
                                        ))}
                                    {student.enrolled_subjects.filter(es => es.is_active).length > 4 && (
                                        <span className="text-[10px] text-gray-400">
                                            +{student.enrolled_subjects.filter(es => es.is_active).length - 4}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="grid grid-cols-5 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50 text-center">
                            <button
                                onClick={() => sendWhatsApp(student.family_id?.father_mobile || student.father_mobile)}
                                className="py-3 hover:bg-green-50 text-green-600 flex justify-center items-center"
                                title={t('whatsapp')}
                            >
                                <MessageCircle size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    const mobile = student.family_id?.father_mobile || student.father_mobile;
                                    if (!mobile) return alert("No Mobile Number");
                                    window.location.href = `tel:${mobile}`;
                                }}
                                className="py-3 hover:bg-blue-50 text-blue-600 flex justify-center items-center"
                                title={t('call')}
                            >
                                <Phone size={18} />
                            </button>
                            <button
                                onClick={() => handleViewProfile(student)}
                                className="py-3 hover:bg-purple-50 text-purple-600 flex justify-center items-center"
                                title={t('profile')}
                            >
                                <User size={18} />
                            </button>
                            <button
                                onClick={() => handleEdit(student)}
                                className="py-3 hover:bg-yellow-50 text-yellow-600 flex justify-center items-center"
                                title={t('edit')}
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(student._id, student.full_name)}
                                className="py-3 hover:bg-red-50 text-red-600 flex justify-center items-center"
                                title={t('delete')}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-5 text-[10px] text-gray-400 font-bold uppercase tracking-tighter pb-1 border-b">
                            <span className="text-center">WA</span>
                            <span className="text-center">Call</span>
                            <span className="text-center">Prof</span>
                            <span className="text-center">Edit</span>
                            <span className="text-center">Del</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Add Form Floating or Bottom (Optional) */}
            <div className="mt-8 bg-gray-50 p-6 rounded border-2 border-dashed border-gray-300">
                <h3 className="font-bold mb-4 text-gray-500 uppercase tracking-widest text-sm">{t('add_student')} (Quick)</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input name="full_name" placeholder="Name" onChange={handleChange} value={formData.full_name} className="p-2 border rounded" required />
                        <input name="roll_no" placeholder="Roll No" onChange={handleChange} value={formData.roll_no} className="p-2 border rounded" required />
                        <input name="father_name" placeholder="Father Name" onChange={handleChange} value={formData.father_name} className="p-2 border rounded" required />
                        <input name="father_mobile" placeholder="Mobile" onChange={handleChange} value={formData.father_mobile} className="p-2 border rounded" required />

                        <select name="class_id" onChange={handleChange} value={formData.class_id} className="p-2 border rounded" required>
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>

                        <input name="section_id" placeholder="Section (A/B/C)" onChange={handleChange} value={formData.section_id} className="p-2 border rounded" required />

                        <input
                            type="number"
                            name="monthly_fee"
                            placeholder="Monthly Fee"
                            onChange={handleChange}
                            value={formData.monthly_fee}
                            className="p-2 border rounded"
                        />
                        <input
                            type="number"
                            name="concession"
                            placeholder="Concession"
                            onChange={handleChange}
                            value={formData.concession}
                            className="p-2 border rounded"
                        />
                        <input type="file" name="image" onChange={handleChange} className="p-1 border rounded bg-white text-sm" />
                    </div>

                    {/* Subject Selection */}
                    {subjects.length > 0 && (
                        <div className="border rounded p-4 bg-white">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Subjects ({formData.subjects.length} selected)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {subjects.map(subject => (
                                    <label key={subject._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.subjects.includes(subject._id)}
                                            onChange={() => handleSubjectToggle(subject._id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <button className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">{t('save')}</button>
                </form>
            </div>
        </div>
    );
};

export default Students;
