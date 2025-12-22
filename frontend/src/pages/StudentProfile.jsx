import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Phone, MessageCircle, Printer, Edit, User, Calendar, DollarSign, BookOpen, Award } from 'lucide-react';
import API_URL from '../config';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [student, setStudent] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [fees, setFees] = useState([]);
    const [results, setResults] = useState([]);
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchStudentProfile();
    }, [id, user]);

    const fetchStudentProfile = async () => {
        try {
            setLoading(true);

            // Fetch student details
            const studentRes = await axios.get(`${API_URL}/api/students/${id}/profile`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStudent(studentRes.data);

            // Fetch attendance summary
            const attendanceRes = await axios.get(`${API_URL}/api/students/${id}/attendance-summary`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAttendance(attendanceRes.data);

            // Fetch fee records
            const feeRes = await axios.get(`${API_URL}/api/fees/ledger/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFees(feeRes.data);

            // Fetch exam results
            const resultsRes = await axios.get(`${API_URL}/api/students/${id}/exam-results`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setResults(resultsRes.data);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching student profile:', error);
            setLoading(false);
        }
    };

    const sendWhatsAppReport = (reportType) => {
        const mobile = student.family_id?.father_mobile || student.father_mobile;
        if (!mobile) return alert('No mobile number found');

        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) num = '92' + num.substring(1);

        let message = '';
        switch (reportType) {
            case 'attendance':
                message = `Dear Parent,\n\nAttendance Report for ${student.full_name}:\n\nPresent: ${attendance.present} days\nAbsent: ${attendance.absent} days\nLeave: ${attendance.leave} days\nAttendance: ${attendance.percentage}%\n\nRegards,\nSchool Management`;
                break;
            case 'fee':
                const latestFee = fees[0];
                if (latestFee) {
                    message = `Dear Parent,\n\nFee Status for ${student.full_name}:\n\nMonth: ${latestFee.month}\nTotal Amount: Rs. ${latestFee.gross_amount}\nPaid: Rs. ${latestFee.paid_amount}\nBalance: Rs. ${latestFee.balance}\nStatus: ${latestFee.status}\n\nRegards,\nSchool Management`;
                }
                break;
            case 'result':
                const latestResult = results[0];
                if (latestResult) {
                    message = `Dear Parent,\n\nExam Result for ${student.full_name}:\n\nExam: ${latestResult.exam_id?.name}\nTotal Marks: ${latestResult.total_obtained}/${latestResult.total_max}\nPercentage: ${latestResult.percentage}%\n\nRegards,\nSchool Management`;
                }
                break;
            default:
                message = `Dear Parent,\n\nThis is a message regarding ${student.full_name}.\n\nRegards,\nSchool Management`;
        }

        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCall = () => {
        const mobile = student.family_id?.father_mobile || student.father_mobile;
        if (!mobile) return alert('No mobile number found');
        window.location.href = `tel:${mobile}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading student profile...</div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Student not found</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 no-print">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        {/* Student Photo */}
                        <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden border-4 border-blue-500 flex-shrink-0">
                            {student.image ? (
                                <img src={`${API_URL}${student.image}`} alt={student.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-full h-full p-4 text-gray-400" />
                            )}
                        </div>

                        {/* Student Info */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{student.full_name}</h1>
                            <p className="text-gray-600">Roll No: <span className="font-semibold">{student.roll_no}</span></p>
                            <p className="text-gray-600">Class: <span className="font-semibold">{student.class_id}-{student.section_id}</span></p>
                            <p className="text-gray-600">Father: <span className="font-semibold">{student.father_name || student.family_id?.father_name}</span></p>
                            <p className="text-gray-600">Mobile: <span className="font-semibold">{student.family_id?.father_mobile || student.father_mobile}</span></p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>
                        <button
                            onClick={handleCall}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Phone size={18} />
                            Call
                        </button>
                        <button
                            onClick={() => sendWhatsAppReport('general')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            <MessageCircle size={18} />
                            WhatsApp
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                        <button
                            onClick={() => navigate(`/students/edit/${id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                            <Edit size={18} />
                            Edit
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-lg mb-6 no-print">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <User size={18} />
                        Personal Info
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold ${activeTab === 'attendance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <Calendar size={18} />
                        Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('fees')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold ${activeTab === 'fees' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <DollarSign size={18} />
                        Fee Records
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold ${activeTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <Award size={18} />
                        Exam Results
                    </button>
                    <button
                        onClick={() => setActiveTab('subjects')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold ${activeTab === 'subjects' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <BookOpen size={18} />
                        Subjects
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Personal Info Tab */}
                {activeTab === 'info' && (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-blue-700">Student Information</h3>
                            <div className="space-y-2">
                                <p><span className="font-semibold">Full Name:</span> {student.full_name}</p>
                                <p><span className="font-semibold">Roll Number:</span> {student.roll_no}</p>
                                <p><span className="font-semibold">Class:</span> {student.class_id}-{student.section_id}</p>
                                <p><span className="font-semibold">Gender:</span> {student.gender || 'N/A'}</p>
                                <p><span className="font-semibold">Date of Birth:</span> {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p>
                                <p><span className="font-semibold">Blood Group:</span> {student.blood_group || 'N/A'}</p>
                                <p><span className="font-semibold">Religion:</span> {student.religion || 'N/A'}</p>
                                <p><span className="font-semibold">Nationality:</span> {student.nationality || 'Pakistani'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-blue-700">Family Information</h3>
                            <div className="space-y-2">
                                <p><span className="font-semibold">Father Name:</span> {student.father_name || student.family_id?.father_name || 'N/A'}</p>
                                <p><span className="font-semibold">Father Mobile:</span> {student.family_id?.father_mobile || student.father_mobile || 'N/A'}</p>
                                <p><span className="font-semibold">Mother Name:</span> {student.mother_name || 'N/A'}</p>
                                <p><span className="font-semibold">Mother Mobile:</span> {student.mother_mobile || 'N/A'}</p>
                                <p><span className="font-semibold">Emergency Contact:</span> {student.emergency_contact || 'N/A'}</p>
                                <p><span className="font-semibold">Address:</span> {student.address || student.current_address || 'N/A'}</p>
                                <p><span className="font-semibold">City:</span> {student.city || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-blue-700">Academic Information</h3>
                            <div className="space-y-2">
                                <p><span className="font-semibold">Admission Date:</span> {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'}</p>
                                <p><span className="font-semibold">Admission Number:</span> {student.admission_number || 'N/A'}</p>
                                <p><span className="font-semibold">Previous School:</span> {student.previous_school || 'N/A'}</p>
                                <p><span className="font-semibold">Monthly Fee:</span> Rs. {student.monthly_fee || 5000}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-blue-700">Medical Information</h3>
                            <div className="space-y-2">
                                <p><span className="font-semibold">Medical Conditions:</span> {student.medical_conditions || 'None'}</p>
                                <p><span className="font-semibold">Allergies:</span> {student.allergies || 'None'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-blue-700">Attendance Summary</h3>
                            <button
                                onClick={() => sendWhatsAppReport('attendance')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                <MessageCircle size={18} />
                                Send via WhatsApp
                            </button>
                        </div>

                        {attendance && (
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                                    <p className="text-sm text-gray-600">Total Days</p>
                                    <p className="text-3xl font-bold text-blue-700">{attendance.total_days}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                                    <p className="text-sm text-gray-600">Present</p>
                                    <p className="text-3xl font-bold text-green-700">{attendance.present}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                                    <p className="text-sm text-gray-600">Absent</p>
                                    <p className="text-3xl font-bold text-red-700">{attendance.absent}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-600">
                                    <p className="text-sm text-gray-600">Attendance %</p>
                                    <p className="text-3xl font-bold text-yellow-700">{attendance.percentage}%</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded">
                            <p className="text-sm text-gray-600">
                                {attendance && attendance.percentage >= 75
                                    ? '✅ Good attendance record'
                                    : '⚠️ Attendance below 75% - Please improve'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Fee Records Tab */}
                {activeTab === 'fees' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-blue-700">Fee Ledger</h3>
                            <button
                                onClick={() => sendWhatsAppReport('fee')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                <MessageCircle size={18} />
                                Send via WhatsApp
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Month</th>
                                        <th className="border p-2 text-right">Tuition Fee</th>
                                        <th className="border p-2 text-right">Concession</th>
                                        <th className="border p-2 text-right">Gross Amount</th>
                                        <th className="border p-2 text-right">Paid</th>
                                        <th className="border p-2 text-right">Balance</th>
                                        <th className="border p-2 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.length > 0 ? fees.map((fee, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="border p-2">{fee.month}</td>
                                            <td className="border p-2 text-right">Rs. {fee.tuition_fee}</td>
                                            <td className="border p-2 text-right">Rs. {fee.concession}</td>
                                            <td className="border p-2 text-right font-semibold">Rs. {fee.gross_amount}</td>
                                            <td className="border p-2 text-right text-green-600">Rs. {fee.paid_amount}</td>
                                            <td className="border p-2 text-right text-red-600 font-semibold">Rs. {fee.balance}</td>
                                            <td className="border p-2 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                        fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {fee.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="border p-4 text-center text-gray-500">
                                                No fee records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Exam Results Tab */}
                {activeTab === 'results' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-blue-700">Exam Results</h3>
                            <button
                                onClick={() => sendWhatsAppReport('result')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                <MessageCircle size={18} />
                                Send via WhatsApp
                            </button>
                        </div>

                        <div className="space-y-4">
                            {results.length > 0 ? results.map((result, idx) => (
                                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-lg">{result.exam_id?.name || 'Exam'}</h4>
                                            <p className="text-sm text-gray-600">
                                                Date: {result.exam_id?.date ? new Date(result.exam_id.date).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-blue-700">{result.percentage}%</p>
                                            <p className="text-sm text-gray-600">{result.total_obtained}/{result.total_max}</p>
                                        </div>
                                    </div>

                                    {result.subjects && result.subjects.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            {result.subjects.map((sub, subIdx) => (
                                                <div key={subIdx} className="bg-white p-2 rounded border">
                                                    <p className="text-xs font-semibold">{sub.subject_name}</p>
                                                    <p className="text-sm">{sub.obtained_marks}/{sub.total_marks}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 py-8">
                                    No exam results found
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Subjects Tab */}
                {activeTab === 'subjects' && (
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-blue-700">Enrolled Subjects</h3>

                        {student.enrolled_subjects && student.enrolled_subjects.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {student.enrolled_subjects
                                    .filter(es => es.is_active)
                                    .map((es, idx) => (
                                        <div key={idx} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                                            <h4 className="font-bold text-lg">{es.subject_id?.name || 'N/A'}</h4>
                                            <p className="text-sm text-gray-600">Code: {es.subject_id?.code || 'N/A'}</p>
                                            <p className="text-sm text-gray-600">Total Marks: {es.subject_id?.total_marks || 100}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Enrolled: {new Date(es.enrollment_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No subjects enrolled
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    );
};

export default StudentProfile;
