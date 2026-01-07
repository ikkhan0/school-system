import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import AuthContext from '../context/AuthContext';
import SettingsContext from '../context/SettingsContext';
import { formatDate } from '../utils/dateFormatter';
import { ArrowLeft, Phone, MessageCircle, Printer, Edit, User, Calendar, DollarSign, BookOpen, Award, X, Save, Download, FileText } from 'lucide-react';
import { generateFeeVoucherPDF, generateResultCardPDF, downloadPDF, sharePDFViaWhatsApp } from '../utils/pdfGenerator';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { dateFormat } = useContext(SettingsContext);
    const [student, setStudent] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [fees, setFees] = useState([]);
    const [results, setResults] = useState([]);
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [showFeeVoucherModal, setShowFeeVoucherModal] = useState(false);
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [schoolInfo, setSchoolInfo] = useState(null);

    useEffect(() => {
        if (!user) return;
        fetchStudentProfile();
    }, [id, user]);

    const fetchStudentProfile = async () => {
        try {
            setLoading(true);

            const studentRes = await axios.get(`${API_URL}/api/students/${id}/profile`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            console.log('📥 Student profile received:', {
                hasPhoto: !!studentRes.data.photo,
                photoType: typeof studentRes.data.photo,
                photoLength: studentRes.data.photo ? studentRes.data.photo.length : 0,
                photoPreview: studentRes.data.photo ? studentRes.data.photo.substring(0, 50) + '...' : 'NO PHOTO'
            });

            setStudent(studentRes.data);

            // Properly flatten student data for editing
            const flattenedData = {
                ...studentRes.data,
                // Preserve fields from direct student data first, then family_id as fallback
                father_mobile: studentRes.data.father_mobile || studentRes.data.family_id?.father_mobile || '',
                father_name: studentRes.data.father_name || studentRes.data.family_id?.father_name || '',
                // Keep enrolled_subjects as is (don't modify)
                enrolled_subjects: studentRes.data.enrolled_subjects || []
            };
            setEditFormData(flattenedData);

            const attendanceRes = await axios.get(`${API_URL}/api/students/${id}/attendance-summary`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAttendance(attendanceRes.data);

            const feeRes = await axios.get(`${API_URL}/api/fees/ledger/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFees(feeRes.data);

            const resultsRes = await axios.get(`${API_URL}/api/students/${id}/exam-results`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setResults(resultsRes.data);

            const schoolRes = await axios.get(`${API_URL}/api/school`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSchoolInfo(schoolRes.data);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching student profile:', error);
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async () => {
        try {
            // Create update payload - only send fields that can be updated
            const updatePayload = {
                full_name: editFormData.full_name,
                roll_no: editFormData.roll_no,
                father_name: editFormData.father_name,
                father_mobile: editFormData.father_mobile,
                mother_name: editFormData.mother_name,
                mother_mobile: editFormData.mother_mobile,
                gender: editFormData.gender,
                dob: editFormData.dob,
                blood_group: editFormData.blood_group,
                religion: editFormData.religion,
                nationality: editFormData.nationality,
                address: editFormData.address,
                current_address: editFormData.current_address,
                city: editFormData.city,
                emergency_contact: editFormData.emergency_contact,
                medical_conditions: editFormData.medical_conditions,
                allergies: editFormData.allergies,
                monthly_fee: editFormData.monthly_fee,
                // Preserve enrolled_subjects - don't modify
                enrolled_subjects: editFormData.enrolled_subjects
            };

            await axios.put(`${API_URL}/api/students/${id}`, updatePayload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Student information updated successfully!');
            setShowEditModal(false);
            fetchStudentProfile();
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Failed to update student information');
        }
    };

    const sendWhatsAppReport = (reportType) => {
        // Priority: father_mobile → mother_mobile (fallback)
        const mobile = student.father_mobile || student.family_id?.father_mobile || student.mother_mobile || student.family_id?.mother_mobile;
        if (!mobile) return alert('No mobile number found');

        let num = mobile.replace(/\\D/g, '');
        if (num.length === 11 && num.startsWith('0')) num = '92' + num.substring(1);

        let message = '';
        switch (reportType) {
            case 'attendance':
                message = `Dear Parent,\\n\\nAttendance Report for ${student.full_name}:\\n\\nPresent: ${attendance.present} days\\nAbsent: ${attendance.absent} days\\nLeave: ${attendance.leave} days\\nAttendance: ${attendance.percentage}%\\n\\nRegards,\\nSchool Management`;
                break;
            case 'fee':
                const latestFee = fees[0];
                if (latestFee) {
                    message = `Dear Parent,\\n\\nFee Status for ${student.full_name}:\\n\\nMonth: ${latestFee.month}\\nTotal Amount: Rs. ${latestFee.gross_amount}\\nPaid: Rs. ${latestFee.paid_amount}\\nBalance: Rs. ${latestFee.balance}\\nStatus: ${latestFee.status}\\n\\nRegards,\\nSchool Management`;
                }
                break;
            case 'result':
                const latestResult = results[0];
                if (latestResult) {
                    message = `Dear Parent,\\n\\nExam Result for ${student.full_name}:\\n\\nExam: ${latestResult.exam_id?.name}\\nTotal Marks: ${latestResult.total_obtained}/${latestResult.total_max}\\nPercentage: ${latestResult.percentage}%\\n\\nRegards,\\nSchool Management`;
                }
                break;
            default:
                message = `Dear Parent,\\n\\nThis is a message regarding ${student.full_name}.\\n\\nRegards,\\nSchool Management`;
        }

        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleDownloadFeeVoucher = (fee) => {
        const doc = generateFeeVoucherPDF(student, fee, schoolInfo || {});
        downloadPDF(doc, `Fee_Voucher_${student.roll_no}_${fee.month}.pdf`);
    };

    const handleShareFeeVoucher = (fee) => {
        // Priority: father_mobile → mother_mobile (fallback)
        const mobile = student.family_id?.father_mobile || student.father_mobile || student.family_id?.mother_mobile || student.mother_mobile;
        const doc = generateFeeVoucherPDF(student, fee, schoolInfo || {});
        const message = `Dear Parent, please find the fee voucher for ${student.full_name} (${student.roll_no}) for ${fee.title || fee.month}. Amount: Rs. ${fee.gross_amount}.`;
        sharePDFViaWhatsApp(doc, `Fee_Voucher_${student.roll_no}_${fee.month}.pdf`, mobile, message);
    };

    const handleDownloadResultCard = (result) => {
        const doc = generateResultCardPDF(student, result, schoolInfo || {});
        downloadPDF(doc, `Result_Card_${student.roll_no}_${result.exam_id?.name || 'Exam'}.pdf`);
    };

    const handleShareResultCard = (result) => {
        // Priority: father_mobile → mother_mobile (fallback)
        const mobile = student.family_id?.father_mobile || student.father_mobile || student.family_id?.mother_mobile || student.mother_mobile;
        const doc = generateResultCardPDF(student, result, schoolInfo || {});
        const message = `Dear Parent, please find the result card for ${student.full_name} (${student.roll_no}) for ${result.exam_id?.name || 'Exam'}.`;
        sharePDFViaWhatsApp(doc, `Result_Card_${student.roll_no}_${result.exam_id?.name || 'Exam'}.pdf`, mobile, message);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCall = () => {
        // Priority: father_mobile → mother_mobile (fallback)
        const mobile = student.family_id?.father_mobile || student.father_mobile || student.family_id?.mother_mobile || student.mother_mobile;
        if (!mobile) return alert('No mobile number found');
        window.location.href = `tel:${mobile}`;
    };

    const handlePrintCurrentFeeVoucher = () => {
        // Calculate total outstanding balance
        const totalBalance = fees.reduce((sum, fee) => sum + (fee.balance || 0), 0);

        if (totalBalance <= 0) {
            alert('No outstanding balance to print voucher for.');
            return;
        }

        setShowFeeVoucherModal(true);
    };

    const generateVoucherData = () => {
        // Get current month
        const currentDate = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = `${monthNames[currentDate.getMonth()]}-${currentDate.getFullYear()}`;

        // Separate Funds and Arrears
        let arrears = 0;
        let currentFeeAmount = 0;
        let currentFeeFound = false;
        const outstanding_funds = [];

        fees.forEach(fee => {
            if (fee.status !== 'Paid' && (fee.balance || 0) > 0) {
                if (fee.fee_type === 'Fund') {
                    outstanding_funds.push({ title: fee.title, amount: fee.balance });
                } else if (fee.month === currentMonth && (fee.fee_type === 'Tuition' || !fee.fee_type)) {
                    currentFeeFound = true;
                    currentFeeAmount = fee.balance;
                } else {
                    arrears += (fee.balance || 0);
                }
            }
        });

        const mainAmount = currentFeeFound ? currentFeeAmount : (student.monthly_fee || 5000);
        const fundsTotal = outstanding_funds.reduce((sum, f) => sum + f.amount, 0);
        const discountAmount = parseFloat(voucherDiscount) || 0;

        const totalAmount = (mainAmount + arrears + fundsTotal) - discountAmount;

        // Calculate due date (10 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 10);

        // Create fee voucher data
        return {
            month: currentMonth,
            title: 'Monthly Fee',
            gross_amount: mainAmount,
            arrears: arrears,
            outstanding_funds: outstanding_funds,
            discount_amount: discountAmount,
            total_amount: totalAmount > 0 ? totalAmount : 0,
            status: 'Unpaid',
            due_date: formatDate(dueDate, dateFormat),
            printed_by: user?.full_name || user?.username || 'System'
        };
    };

    const handlePrintVoucher = () => {
        try {
            const voucherData = generateVoucherData();
            const doc = generateFeeVoucherPDF(student, voucherData, schoolInfo || {});

            // Open print dialog
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(url);

            if (printWindow) {
                printWindow.addEventListener('load', () => {
                    printWindow.print();
                });
            } else {
                alert('Please allow popups to print the voucher.');
            }

            setShowFeeVoucherModal(false);
            setVoucherDiscount(0);
        } catch (error) {
            console.error('Error printing voucher:', error);
            alert('Error printing voucher: ' + error.message);
        }
    };

    const handleSavePDF = () => {
        try {
            const voucherData = generateVoucherData();
            const currentMonth = voucherData.month;
            const doc = generateFeeVoucherPDF(student, voucherData, schoolInfo || {});
            downloadPDF(doc, `Fee_Voucher_${student.roll_no}_${currentMonth}.pdf`);

            setShowFeeVoucherModal(false);
            setVoucherDiscount(0);
        } catch (error) {
            console.error('Error saving PDF:', error);
            alert('Error saving PDF: ' + error.message);
        }
    };

    const handleWhatsAppVoucher = () => {
        try {
            const voucherData = generateVoucherData();
            const currentMonth = voucherData.month;
            // Priority: father_mobile → mother_mobile (fallback)
            const mobile = student.family_id?.father_mobile || student.father_mobile || student.family_id?.mother_mobile || student.mother_mobile;

            if (!mobile) {
                alert('No mobile number found for this student.');
                return;
            }

            const doc = generateFeeVoucherPDF(student, voucherData, schoolInfo || {});
            const message = `Dear Parent, please find the fee voucher for ${student.full_name} (${student.roll_no}) for ${currentMonth}. Total Amount: Rs. ${voucherData.total_amount}`;
            sharePDFViaWhatsApp(doc, `Fee_Voucher_${student.roll_no}_${currentMonth}.pdf`, mobile, message);

            setShowFeeVoucherModal(false);
            setVoucherDiscount(0);
        } catch (error) {
            console.error('Error sharing via WhatsApp:', error);
            alert('Error sharing via WhatsApp: ' + error.message);
        }
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

    // Check if user has permission to apply discount
    const canApplyDiscount = user && (
        user.role === 'super_admin' ||
        user.role === 'school_admin' ||
        user.role === 'accountant' ||
        (user.permissions && (user.permissions.includes('fees.discount') || user.permissions.includes('fees.*')))
    );

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-4 md:p-6 mb-6 no-print text-white">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full overflow-hidden border-4 border-white flex-shrink-0 mx-auto sm:mx-0">
                            {student.photo ? (
                                <img
                                    src={student.photo.startsWith('http') || student.photo.startsWith('data:image/') ? student.photo : `${API_URL}${student.photo}`}
                                    alt={student.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-full h-full p-4 text-gray-400" />
                            )}
                        </div>

                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold">{student.full_name}</h1>
                            <p className="text-blue-100 text-sm md:text-base">Roll No: <span className="font-semibold">{student.roll_no}</span></p>
                            <p className="text-blue-100 text-sm md:text-base">Class: <span className="font-semibold">{student.class_id}-{student.section_id}</span></p>
                            <p className="text-blue-100 text-sm md:text-base">Father: <span className="font-semibold">{student.father_name || student.family_id?.father_name}</span></p>
                            <p className="text-blue-100 text-sm md:text-base">Mobile: <span className="font-semibold">{student.father_mobile || student.family_id?.father_mobile}</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 md:justify-end">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-white text-blue-700 rounded hover:bg-blue-50 text-sm md:text-base"
                        >
                            <ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                        <button
                            onClick={handleCall}
                            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm md:text-base"
                        >
                            <Phone size={16} className="md:w-[18px] md:h-[18px]" />
                            <span className="hidden sm:inline">Call</span>
                        </button>
                        <button
                            onClick={() => sendWhatsAppReport('general')}
                            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm md:text-base"
                        >
                            <MessageCircle size={16} className="md:w-[18px] md:h-[18px]" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm md:text-base"
                        >
                            <Printer size={16} className="md:w-[18px] md:h-[18px]" />
                            <span className="hidden sm:inline">Print</span>
                        </button>
                        <button
                            onClick={handlePrintCurrentFeeVoucher}
                            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm md:text-base col-span-2 sm:col-span-1"
                        >
                            <FileText size={16} className="md:w-[18px] md:h-[18px]" />
                            <span>Fee Voucher</span>
                        </button>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm md:text-base col-span-2 sm:col-span-1"
                        >
                            <Edit size={16} className="md:w-[18px] md:h-[18px]" />
                            <span>Edit Info</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-lg mb-6 no-print">
                <div className="flex border-b overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <User size={18} />
                        Personal Info
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap ${activeTab === 'attendance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <Calendar size={18} />
                        Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('fees')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap ${activeTab === 'fees' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <DollarSign size={18} />
                        Fee Records
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap ${activeTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <Award size={18} />
                        Exam Results
                    </button>
                    <button
                        onClick={() => setActiveTab('subjects')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap ${activeTab === 'subjects' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h3 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
                                <User size={20} />
                                Student Information
                            </h3>
                            <div className="space-y-3">
                                <InfoRow label="Full Name" value={student.full_name} />
                                <InfoRow label="Roll Number" value={student.roll_no} />
                                <InfoRow label="Class" value={`${student.class_id}-${student.section_id}`} />
                                <InfoRow label="Gender" value={student.gender} />
                                <InfoRow label="Date of Birth" value={student.dob ? formatDate(student.dob, dateFormat) : null} />
                                <InfoRow label="Blood Group" value={student.blood_group} />
                                <InfoRow label="Religion" value={student.religion} />
                                <InfoRow label="Nationality" value={student.nationality || 'Pakistani'} />
                            </div>
                        </div>

                        <div className="bg-green-50 p-6 rounded-lg">
                            <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
                                <User size={20} />
                                Family Information
                            </h3>
                            <div className="space-y-3">
                                <InfoRow label="Father Name" value={student.father_name || student.family_id?.father_name} />
                                <InfoRow label="Father Mobile" value={student.father_mobile || student.family_id?.father_mobile} />
                                <InfoRow label="Mother Name" value={student.mother_name || student.family_id?.mother_name} />
                                <InfoRow label="Mother Mobile" value={student.mother_mobile || student.family_id?.mother_mobile} />
                                <InfoRow label="Emergency Contact" value={student.emergency_contact || student.family_id?.emergency_contact} />
                                <InfoRow label="Address" value={student.address || student.current_address || student.family_id?.address} />
                                <InfoRow label="City" value={student.city} />
                            </div>
                        </div>

                        <div className="bg-purple-50 p-6 rounded-lg">
                            <h3 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
                                <BookOpen size={20} />
                                Academic Information
                            </h3>
                            <div className="space-y-3">
                                <InfoRow label="Admission Date" value={student.admission_date ? formatDate(student.admission_date, dateFormat) : null} />
                                <InfoRow label="Admission Number" value={student.admission_number} />
                                <InfoRow label="Previous School" value={student.previous_school} />
                                <InfoRow label="Monthly Fee" value={`Rs. ${student.monthly_fee || 5000}`} />
                            </div>
                        </div>

                        <div className="bg-red-50 p-6 rounded-lg">
                            <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">
                                <Award size={20} />
                                Medical Information
                            </h3>
                            <div className="space-y-3">
                                <InfoRow label="Medical Conditions" value={student.medical_conditions || 'None'} />
                                <InfoRow label="Allergies" value={student.allergies || 'None'} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-blue-700">Attendance Summary</h3>
                            <button
                                onClick={() => sendWhatsAppReport('attendance')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                <MessageCircle size={18} />
                                Send via WhatsApp
                            </button>
                        </div>

                        {attendance && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
                                    <p className="text-sm opacity-90">Total Days</p>
                                    <p className="text-4xl font-bold mt-2">{attendance.total_days}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
                                    <p className="text-sm opacity-90">Present</p>
                                    <p className="text-4xl font-bold mt-2">{attendance.present}</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg text-white shadow-lg">
                                    <p className="text-sm opacity-90">Absent</p>
                                    <p className="text-4xl font-bold mt-2">{attendance.absent}</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg text-white shadow-lg">
                                    <p className="text-sm opacity-90">Attendance %</p>
                                    <p className="text-4xl font-bold mt-2">{attendance.percentage}%</p>
                                </div>
                            </div>
                        )}

                        <div className={`p-4 rounded-lg ${attendance && attendance.percentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <p className="font-semibold">
                                {attendance && attendance.percentage >= 75
                                    ? '✅ Good attendance record - Keep it up!'
                                    : '⚠️ Attendance below 75% - Please improve attendance'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Fee Records Tab */}
                {activeTab === 'fees' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-blue-700">Fee Ledger</h3>
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
                                    <tr className="bg-blue-600 text-white">
                                        <th className="border border-blue-700 p-3 text-left">Month</th>
                                        <th className="border border-blue-700 p-3 text-right">Fee Amount</th>
                                        <th className="border border-blue-700 p-3 text-right">Concession</th>
                                        <th className="border border-blue-700 p-3 text-right">Gross Amount</th>
                                        <th className="border border-blue-700 p-3 text-right">Paid</th>
                                        <th className="border border-blue-700 p-3 text-right">Balance</th>
                                        <th className="border border-blue-700 p-3 text-center">Status</th>
                                        <th className="border border-blue-700 p-3 text-center">Print</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.length > 0 ? fees.map((fee, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="border p-3 font-semibold">
                                                {fee.month}
                                                {fee.title && <div className="text-xs text-gray-500 font-normal">{fee.title}</div>}
                                            </td>
                                            <td className="border p-3 text-right">Rs. {fee.tuition_fee}</td>
                                            <td className="border p-3 text-right text-green-600">Rs. {fee.concession}</td>
                                            <td className="border p-3 text-right font-bold">Rs. {fee.gross_amount}</td>
                                            <td className="border p-3 text-right text-green-600 font-semibold">Rs. {fee.paid_amount}</td>
                                            <td className="border p-3 text-right text-red-600 font-bold">Rs. {fee.balance}</td>
                                            <td className="border p-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                    fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {fee.status}
                                                </span>
                                            </td>
                                            <td className="border p-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDownloadFeeVoucher(fee)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={14} />
                                                        <span className="hidden sm:inline">PDF</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleShareFeeVoucher(fee)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                        title="Share via WhatsApp"
                                                    >
                                                        <MessageCircle size={14} />
                                                        <span className="hidden sm:inline">Share</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="8" className="border p-8 text-center text-gray-500">
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
                            <h3 className="text-2xl font-bold text-blue-700">Exam Results</h3>
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
                                <div key={idx} className="border-2 border-blue-200 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-white shadow-md">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-2xl text-blue-700">{result.exam_id?.name || 'Exam'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Date: {result.exam_id?.date ? formatDate(result.exam_id.date, dateFormat) : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right bg-blue-600 text-white px-6 py-3 rounded-lg">
                                            <p className="text-3xl font-bold">{result.percentage}%</p>
                                            <p className="text-sm">{result.total_obtained}/{result.total_max}</p>
                                        </div>
                                    </div>

                                    {result.subjects && result.subjects.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                                            {result.subjects.map((sub, subIdx) => (
                                                <div key={subIdx} className="bg-white p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition">
                                                    <p className="text-xs font-semibold text-gray-600">{sub.subject_name}</p>
                                                    <p className="text-lg font-bold text-blue-700">{sub.obtained_marks}/{sub.total_marks}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => handleDownloadResultCard(result)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            <Download size={18} />
                                            Download PDF
                                        </button>
                                        <button
                                            onClick={() => handleShareResultCard(result)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            <MessageCircle size={18} />
                                            Share via WhatsApp
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                                    <Award size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg">No exam results found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Subjects Tab */}
                {activeTab === 'subjects' && (
                    <div>
                        <h3 className="text-2xl font-bold mb-6 text-blue-700">Enrolled Subjects</h3>

                        {student.enrolled_subjects && student.enrolled_subjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {student.enrolled_subjects
                                    .filter(es => es.is_active)
                                    .map((es, idx) => (
                                        <div key={idx} className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg hover:shadow-xl transition">
                                            <h4 className="font-bold text-2xl mb-2">{es.subject_id?.name || 'N/A'}</h4>
                                            <p className="text-sm opacity-90">Code: {es.subject_id?.code || 'N/A'}</p>
                                            <p className="text-sm opacity-90">Total Marks: {es.subject_id?.total_marks || 100}</p>
                                            <p className="text-xs mt-3 opacity-75">
                                                Enrolled: {formatDate(es.enrollment_date, dateFormat)}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                                <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">No subjects enrolled</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-blue-600 text-white p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Edit Student Information</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={editFormData.full_name || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Roll Number *</label>
                                    <input
                                        type="text"
                                        name="roll_no"
                                        value={editFormData.roll_no || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Father Name</label>
                                    <input
                                        type="text"
                                        name="father_name"
                                        value={editFormData.father_name || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Father Mobile</label>
                                    <input
                                        type="text"
                                        name="father_mobile"
                                        value={editFormData.father_mobile || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mother Name</label>
                                    <input
                                        type="text"
                                        name="mother_name"
                                        value={editFormData.mother_name || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mother Mobile</label>
                                    <input
                                        type="text"
                                        name="mother_mobile"
                                        value={editFormData.mother_mobile || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={editFormData.gender || ''}
                                        onChange={handleEditChange}
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
                                        value={editFormData.dob ? editFormData.dob.split('T')[0] : ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                                    <select
                                        name="blood_group"
                                        value={editFormData.blood_group || ''}
                                        onChange={handleEditChange}
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
                                        value={editFormData.religion || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact</label>
                                    <input
                                        type="text"
                                        name="emergency_contact"
                                        value={editFormData.emergency_contact || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={editFormData.city || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        value={editFormData.address || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                        rows="2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Date</label>
                                    <input
                                        type="date"
                                        name="admission_date"
                                        value={editFormData.admission_date ? editFormData.admission_date.split('T')[0] : ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Previous School</label>
                                    <input
                                        type="text"
                                        name="previous_school"
                                        value={editFormData.previous_school || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Medical Conditions</label>
                                    <input
                                        type="text"
                                        name="medical_conditions"
                                        value={editFormData.medical_conditions || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Allergies</label>
                                    <input
                                        type="text"
                                        name="allergies"
                                        value={editFormData.allergies || ''}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fee Voucher Modal */}
            {showFeeVoucherModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                        <div className="bg-orange-600 text-white p-6 flex justify-between items-center rounded-t-lg">
                            <h2 className="text-2xl font-bold">Print Fee Voucher</h2>
                            <button onClick={() => { setShowFeeVoucherModal(false); setVoucherDiscount(0); }} className="text-white hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                    <h3 className="font-bold text-lg text-blue-700 mb-2">Outstanding Balance</h3>
                                    <p className="text-3xl font-bold text-blue-900">
                                        Rs. {fees.reduce((sum, fee) => sum + (fee.balance || 0), 0).toFixed(2)}
                                    </p>
                                </div>

                                {canApplyDiscount && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Apply Discount (Optional)
                                        </label>
                                        <input
                                            type="number"
                                            value={voucherDiscount}
                                            onChange={(e) => setVoucherDiscount(e.target.value)}
                                            placeholder="Enter discount amount"
                                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                )}

                                {voucherDiscount > 0 && (
                                    <div className="mt-4 bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Final Amount After Discount:</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            Rs. {(fees.reduce((sum, fee) => sum + (fee.balance || 0), 0) - parseFloat(voucherDiscount)).toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handlePrintVoucher}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                                >
                                    <Printer size={18} />
                                    Print Voucher
                                </button>

                                <button
                                    onClick={handleSavePDF}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                                >
                                    <Download size={18} />
                                    Save as PDF
                                </button>

                                <button
                                    onClick={handleWhatsAppVoucher}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                                >
                                    <MessageCircle size={18} />
                                    Send via WhatsApp
                                </button>

                                <button
                                    onClick={() => { setShowFeeVoucherModal(false); setVoucherDiscount(0); }}
                                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

// Helper component for displaying info rows
const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-start py-2 border-b border-gray-200">
        <span className="font-semibold text-gray-700">{label}:</span>
        <span className="text-gray-900 text-right">{value || 'N/A'}</span>
    </div>
);

export default StudentProfile;
