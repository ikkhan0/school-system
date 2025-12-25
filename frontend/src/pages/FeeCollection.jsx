import { useState, useEffect, useContext } from 'react';
import { Search, Printer, DollarSign, MessageCircle, FileText, Users, Download, Save, Edit, Trash, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const FeeCollection = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('ledger'); // 'ledger', 'family', 'bulk'
    const [searchTerm, setSearchTerm] = useState('');
    const [studentLedger, setStudentLedger] = useState(null); // { student: {}, history: [] }
    const [loading, setLoading] = useState(false);

    // Bulk States
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('A'); // Default A
    const [selectedMonth, setSelectedMonth] = useState('Dec-2025');
    const [bulkStudents, setBulkStudents] = useState([]);
    const [bulkPayments, setBulkPayments] = useState({}); // { student_id: amount }

    // Family View State
    const [familyData, setFamilyData] = useState(null);
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [familySearchTerm, setFamilySearchTerm] = useState('');
    const [familyMonth, setFamilyMonth] = useState('');
    const [familyLoading, setFamilyLoading] = useState(false);

    // Load Classes and School Info on mount
    useEffect(() => {
        if (!user) return;

        // Fetch school info
        fetch(`${API_URL}/api/school`, { headers: { Authorization: `Bearer ${user.token}` } })
            .then(res => res.json())
            .then(data => setSchoolInfo(data))
            .catch(err => console.error("Error fetching school info:", err));

        // Fetch classes
        fetch(`${API_URL}/api/classes`, { headers: { Authorization: `Bearer ${user.token}` } })
            .then(res => res.json())
            .then(data => {
                setClasses(data);
                if (data.length > 0) setSelectedClass(data[0].name);
            });
    }, [user]);

    // --- Actions ---

    const fetchLedger = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // First find student by Roll No or Name
            const searchRes = await fetch(`${API_URL}/api/students?search=${searchTerm}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const students = await searchRes.json();

            if (students.length === 0) {
                alert("Student not found");
                setLoading(false);
                return;
            }

            // Assume first match or exact match logic
            const student = students[0];

            // Fetch Ledger
            const ledgerRes = await fetch(`${API_URL}/api/fees/ledger/${student._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const history = await ledgerRes.json();

            setStudentLedger({ student, history });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBulkList = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/fees/bulk-slips?class_id=${selectedClass}&section_id=${selectedSection}&month=${selectedMonth}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setBulkStudents(data);
            // Reset payments
            const initial = {};
            data.forEach(item => initial[item.student._id] = 0); // Default 0 or item.fee.balance? user usually enters what is paid
            setBulkPayments(initial);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkPaymentChange = (id, val) => {
        setBulkPayments(prev => ({ ...prev, [id]: Number(val) }));
    };

    const [editFeeModal, setEditFeeModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [bulkPaymentDate, setBulkPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    // ... (rest of code) ...

    const handleDeleteFee = async (id) => {
        if (!confirm('Are you sure you want to delete this fee record? This cannot be undone.')) return;

        try {
            const res = await fetch(`${API_URL}/api/fees/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (res.ok) {
                alert('Fee record deleted successfully');
                // Refresh ledger
                const fakeEvent = { preventDefault: () => { } };
                fetchLedger(fakeEvent);
            } else {
                alert('Failed to delete fee record');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting fee record');
        }
    };

    const handleUpdateFee = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/fees/${selectedFee._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    paid_amount: selectedFee.paid_amount,
                    payment_date: selectedFee.payment_date,
                    status: selectedFee.status
                })
            });

            if (res.ok) {
                alert('Fee record updated successfully');
                setEditFeeModal(false);
                // Refresh ledger
                const fakeEvent = { preventDefault: () => { } };
                fetchLedger(fakeEvent);
            } else {
                alert('Failed to update fee record');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating fee record');
        }
    };

    const submitBulkPayments = async () => {
        if (!confirm("Are you sure you want to submit these payments?")) return;

        const payments = Object.entries(bulkPayments)
            .filter(([_, amount]) => amount > 0)
            .map(([student_id, amount]) => {
                const item = bulkStudents.find(s => s.student._id === student_id);
                return {
                    student_id,
                    month: selectedMonth,
                    amount_paying: amount,
                    total_due: item.fee.balance,
                    payment_date: bulkPaymentDate // Pass selected date
                };
            });

        if (payments.length === 0) return alert("No payments entered.");

        try {
            const res = await fetch(`${API_URL}/api/fees/collect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ payments })
            });
            const result = await res.json();
            alert(result.message);
            fetchBulkList(); // Refresh
        } catch (error) {
            alert("Error submitting payments");
        }
    };

    const generateFees = async () => {
        if (!confirm(`Generate fees for ${selectedClass}-${selectedSection} for ${selectedMonth}?\n\nThis will create fee records for all students who don't have one yet.`)) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/fee-generation/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    class_id: selectedClass,
                    section_id: selectedSection,
                    month: selectedMonth
                })
            });
            const result = await res.json();

            if (res.ok) {
                alert(`✅ Fee Generation Complete!\n\nCreated: ${result.created}\nSkipped (already exists): ${result.skipped}\nFailed: ${result.failed || 0}`);
                fetchBulkList(); // Refresh the list
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert("Error generating fees");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const sendWhatsAppLedger = () => {
        if (!studentLedger) return;
        const s = studentLedger.student;
        const totalDue = studentLedger.history.reduce((sum, f) => sum + (f.status !== 'Paid' ? f.balance : 0), 0);

        let msg = `*Fee Ledger for ${s.full_name}*\nRoll No: ${s.roll_no}\n\n`;
        studentLedger.history.forEach(f => {
            msg += `${f.month}: Due ${f.gross_amount} | Paid ${f.paid_amount} | Bal ${f.balance} (${f.status})\n`;
        });
        msg += `\n*Total Pending Due: ${totalDue}*\nPlease clear dues immediately.\n- ${schoolInfo?.name || 'School'}`;

        const mobile = s.family_id?.father_mobile || s.father_mobile;

        if (!mobile) return alert("No mobile number found.");

        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) num = '92' + num.substring(1);

        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const fetchFamilyData = async (e) => {
        e.preventDefault();
        setFamilyLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/families?search=${familySearchTerm}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const families = await res.json();

            if (families.length === 0) {
                alert("Family not found");
                setFamilyLoading(false);
                return;
            }

            const family = families[0];
            const currentMonth = familyMonth || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const feeRes = await fetch(`${API_URL}/api/families/${family._id}/consolidated-fees?month=${currentMonth}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const feeData = await feeRes.json();
            setFamilyData(feeData);
        } catch (error) {
            console.error(error);
            alert("Error fetching family data");
        } finally {
            setFamilyLoading(false);
        }
    };

    const sendWhatsAppFamily = async () => {
        if (!familyData) return;
        try {
            const res = await fetch(`${API_URL}/api/families/${familyData.family._id}/whatsapp-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify({ month: familyData.month })
            });
            const data = await res.json();
            if (data.whatsapp_link) window.open(data.whatsapp_link, '_blank');
        } catch (error) {
            console.error(error);
            alert("Error sending WhatsApp message");
        }
    };

    const printFamilyReceipt = () => {
        if (!familyData) return;
        const printWindow = window.open('', '_blank');
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Family Fee Receipt - ${familyData.family.father_name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .school-name { font-size: 24px; font-weight: bold; }
                    .family-info { margin: 20px 0; padding: 10px; background: #f5f5f5; }
                    .student-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
                    .fee-row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .totals { margin-top: 20px; padding: 15px; background: #e8f4f8; border: 2px solid #333; }
                    .total-amount { font-size: 20px; font-weight: bold; }
                    @media print { button { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="school-name">${schoolInfo?.name || 'School Management System'}</div>
                </div>
                <h2>Family Fee Receipt</h2>
                <div class="family-info">
                    <strong>Family Head:</strong> ${familyData.family.father_name}<br>
                    <strong>Mobile:</strong> ${familyData.family.father_mobile}<br>
                    <strong>Month:</strong> ${familyData.month}<br>
                    <strong>Date:</strong> ${new Date().toLocaleDateString()}
                </div>
                <h3>Children Fee Details:</h3>
                ${familyData.students_with_fees.map(item => `
                    <div class="student-card">
                        <h4>${item.student.full_name} (Roll No: ${item.student.roll_no})</h4>
                        <div class="fee-row"><span>Tuition Fee:</span><span>Rs. ${item.fee.tuition_fee || 0}</span></div>
                        <div class="fee-row"><span>Paid:</span><span style="color: green;">Rs. ${item.fee.paid_amount || 0}</span></div>
                        <div class="fee-row"><span>Balance:</span><span style="color: red;">Rs. ${item.fee.balance || 0}</span></div>
                    </div>
                `).join('')}
                <div class="totals">
                    <div class="fee-row total-amount"><span>Total Balance:</span><span>Rs. ${familyData.totals.total_balance}</span></div>
                </div>
                <div style="margin-top: 40px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Print Receipt</button>
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                <DollarSign size={20} className="sm:w-6 sm:h-6" /> Fee Management
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 border-b overflow-x-auto">
                <button onClick={() => setActiveTab('ledger')} className={`pb-2 px-3 sm:px-4 font-bold flex gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${activeTab === 'ledger' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    <FileText size={16} className="sm:w-[18px] sm:h-[18px]" /> Student Ledger
                </button>
                <button onClick={() => { setActiveTab('bulk'); fetchBulkList(); }} className={`pb-2 px-3 sm:px-4 font-bold flex gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${activeTab === 'bulk' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>
                    <Users size={16} className="sm:w-[18px] sm:h-[18px]" /> Bulk Collection
                </button>
                <button onClick={() => setActiveTab('family')} className={`pb-2 px-3 sm:px-4 font-bold flex gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${activeTab === 'family' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
                    <Users size={16} className="sm:w-[18px] sm:h-[18px]" /> Family View
                </button>
            </div>

            {/* --- LEDGER TAB --- */}
            {
                activeTab === 'ledger' && (
                    <div>
                        {/* ... Search Form ... */}
                        <form onSubmit={fetchLedger} className="flex flex-col sm:flex-row gap-2 max-w-lg mb-4 sm:mb-6">
                            <input
                                type="text"
                                placeholder="Search by Roll No or Name..."
                                className="border p-2 rounded flex-1 text-sm sm:text-base"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm sm:text-base">Search</button>
                        </form>

                        {studentLedger && (
                            <div className="bg-white shadow rounded p-6">
                                {/* ... Header ... */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold">{studentLedger.student.full_name}</h2>
                                        <p className="text-gray-500">Roll No: {studentLedger.student.roll_no} | Class: {studentLedger.student.class_id}</p>
                                    </div>
                                    <button onClick={sendWhatsAppLedger} className="bg-green-100 text-green-700 px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-green-200">
                                        <MessageCircle size={18} /> WhatsApp Ledger
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left bg-gray-50 rounded overflow-hidden min-w-[600px]">
                                        <thead className="bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm">
                                            <tr>
                                                <th className="p-2 sm:p-3">Month</th>
                                                <th className="p-2 sm:p-3 text-right">Total Fee</th>
                                                <th className="p-2 sm:p-3 text-right">Paid</th>
                                                <th className="p-2 sm:p-3 text-right">Balance</th>
                                                <th className="p-2 sm:p-3 text-center">Status</th>
                                                <th className="p-2 sm:p-3 text-right">Date</th>
                                                <th className="p-2 sm:p-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {studentLedger.history.length === 0 ? (
                                                <tr><td colSpan="7" className="p-4 text-center text-gray-500">No fee records found.</td></tr>
                                            ) : (
                                                studentLedger.history.map(rec => (
                                                    <tr key={rec._id}>
                                                        <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">{rec.month}</td>
                                                        <td className="p-2 sm:p-3 text-right text-xs sm:text-sm">{rec.gross_amount}</td>
                                                        <td className="p-2 sm:p-3 text-right text-green-600 font-bold text-xs sm:text-sm">{rec.paid_amount}</td>
                                                        <td className="p-2 sm:p-3 text-right text-red-600 font-bold text-xs sm:text-sm">{rec.balance}</td>
                                                        <td className="p-2 sm:p-3 text-center">
                                                            <span className={`px-2 py-1 rounded text-xs text-white ${rec.status === 'Paid' ? 'bg-green-500' :
                                                                rec.status === 'Partial' ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}>
                                                                {rec.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 sm:p-3 text-right text-xs text-gray-500">
                                                            {rec.payment_date ? new Date(rec.payment_date).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="p-2 sm:p-3 text-center flex justify-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedFee(rec);
                                                                    setEditFeeModal(true);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-800"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteFee(rec._id)}
                                                                className="text-red-600 hover:text-red-800"
                                                                title="Delete"
                                                            >
                                                                <Trash size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* --- BULK COLLECTION TAB --- */}
            {
                activeTab === 'bulk' && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded shadow">
                            <div className="flex-1">
                                <label className="block text-xs sm:text-sm font-bold mb-1">Class</label>
                                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border p-2 rounded text-sm sm:text-base">
                                    {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-bold mb-1">Section</label>
                                <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full border p-2 rounded text-sm sm:text-base">
                                    {classes.find(c => c.name === selectedClass)?.sections.map(s => <option key={s} value={s}>{s}</option>) || <option>A</option>}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-bold mb-1">Month</label>
                                <input type="text" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full border p-2 rounded text-sm sm:text-base" />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-bold mb-1">Payment Date</label>
                                <input type="date" value={bulkPaymentDate} onChange={e => setBulkPaymentDate(e.target.value)} className="w-full border p-2 rounded text-sm sm:text-base" />
                            </div>
                            <div className="flex items-end gap-2">
                                <button onClick={fetchBulkList} className="bg-blue-600 text-white px-2 py-2 rounded font-bold hover:bg-blue-700 w-full text-sm sm:text-base">Load List</button>
                                <button onClick={generateFees} className="bg-purple-600 text-white px-2 py-2 rounded font-bold hover:bg-purple-700 w-full text-sm sm:text-base flex items-center justify-center gap-1">
                                    <FileText size={16} /> Generate
                                </button>
                            </div>
                        </div>
                        {/* ... student list ... */}
                        {bulkStudents.length > 0 && (
                            <div className="bg-white shadow rounded p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg">Student List ({bulkStudents.length})</h3>
                                    <button onClick={submitBulkPayments} className="bg-green-600 text-white px-6 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-700">
                                        <Save size={18} /> Submit Payments
                                    </button>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-600">
                                        <tr>
                                            <th className="p-3">Roll No</th>
                                            <th className="p-3">Name</th>
                                            <th className="p-3 text-right">Fee Due</th>
                                            <th className="p-3 text-right">Arrears</th>
                                            <th className="p-3 text-right">Total Payable</th>
                                            <th className="p-3 w-48 text-right">Paying Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {bulkStudents.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="p-3 font-mono">{item.student.roll_no}</td>
                                                <td className="p-3 font-bold">{item.student.full_name}</td>
                                                <td className="p-3 text-right">{item.fee.fee_due || item.fee.balance || 0}</td>
                                                <td className="p-3 text-right text-red-500">{item.fee.arrears || 0}</td>
                                                <td className="p-3 text-right font-bold text-lg">{item.fee.total_payable || item.fee.balance || 0}</td>
                                                <td className="p-3 text-right">
                                                    <input
                                                        type="number"
                                                        className="border border-green-300 rounded p-1 w-32 text-right font-bold text-green-700 bg-green-50 focus:outline-none focus:ring-2 ring-green-500"
                                                        placeholder="0"
                                                        value={bulkPayments[item.student._id] || ''}
                                                        onChange={(e) => handleBulkPaymentChange(item.student._id, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )
            }

            {/* ... Family Tab ... */}

            {/* Edit Fee Modal */}
            {
                editFeeModal && selectedFee && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Edit Fee Record</h3>
                                <button onClick={() => setEditFeeModal(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleUpdateFee} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Month</label>
                                    <input type="text" value={selectedFee.month} disabled className="w-full border p-2 rounded bg-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Paid Amount</label>
                                    <input
                                        type="number"
                                        value={selectedFee.paid_amount}
                                        onChange={e => setSelectedFee({ ...selectedFee, paid_amount: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Payment Date</label>
                                    <input
                                        type="date"
                                        value={selectedFee.payment_date ? new Date(selectedFee.payment_date).toISOString().split('T')[0] : ''}
                                        onChange={e => setSelectedFee({ ...selectedFee, payment_date: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setEditFeeModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Update</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* --- FAMILY TAB --- */}
            {
                activeTab === 'family' && (
                    <div>
                        <form onSubmit={fetchFamilyData} className="flex flex-col sm:flex-row gap-2 max-w-lg mb-4 sm:mb-6">
                            <input
                                type="text"
                                placeholder="Search by Father Name or Mobile..."
                                className="border p-2 rounded flex-1 text-sm sm:text-base"
                                value={familySearchTerm}
                                onChange={e => setFamilySearchTerm(e.target.value)}
                            />
                            <button className="bg-purple-600 text-white px-4 py-2 rounded font-bold text-sm sm:text-base">Search Family</button>
                        </form>

                        {familyLoading && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading family data...</p>
                            </div>
                        )}

                        {familyData && (
                            <div className="bg-white shadow rounded p-4 sm:p-6">
                                {/* Family Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                                            <Users size={24} className="text-purple-600" />
                                            {familyData.family.father_name}
                                        </h2>
                                        <p className="text-gray-600 text-sm sm:text-base mt-1">
                                            Mobile: {familyData.family.father_mobile}
                                        </p>
                                        <p className="text-gray-600 text-sm sm:text-base">
                                            Children: {familyData.students_with_fees.length}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={sendWhatsAppFamily}
                                            className="flex-1 sm:flex-none bg-green-100 text-green-700 px-4 py-2 rounded flex items-center justify-center gap-2 font-bold hover:bg-green-200 text-sm sm:text-base"
                                        >
                                            <MessageCircle size={18} /> WhatsApp
                                        </button>
                                        <button
                                            onClick={printFamilyReceipt}
                                            className="flex-1 sm:flex-none bg-blue-100 text-blue-700 px-4 py-2 rounded flex items-center justify-center gap-2 font-bold hover:bg-blue-200 text-sm sm:text-base"
                                        >
                                            <Printer size={18} /> Print
                                        </button>
                                    </div>
                                </div>

                                {/* Students List */}
                                <div className="space-y-4">
                                    {familyData.students_with_fees.map((item, idx) => (
                                        <div key={idx} className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:border-purple-300 transition">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                                                <div>
                                                    <h3 className="font-bold text-base sm:text-lg">{item.student.full_name}</h3>
                                                    <p className="text-gray-600 text-xs sm:text-sm">
                                                        Roll No: {item.student.roll_no} | Class: {item.student.class_id}-{item.student.section_id}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded text-xs sm:text-sm font-bold ${item.fee.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                    item.fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.fee.status || 'Pending'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                                                <div>
                                                    <p className="text-gray-500">Tuition Fee</p>
                                                    <p className="font-bold">Rs. {item.fee.tuition_fee || 0}</p>
                                                </div>
                                                {item.fee.other_charges > 0 && (
                                                    <div>
                                                        <p className="text-gray-500">Other Charges</p>
                                                        <p className="font-bold">Rs. {item.fee.other_charges}</p>
                                                    </div>
                                                )}
                                                {item.fee.arrears > 0 && (
                                                    <div>
                                                        <p className="text-gray-500">Arrears</p>
                                                        <p className="font-bold text-red-600">Rs. {item.fee.arrears}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-gray-500">Paid</p>
                                                    <p className="font-bold text-green-600">Rs. {item.fee.paid_amount || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Balance</p>
                                                    <p className="font-bold text-lg text-red-600">Rs. {item.fee.balance || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="mt-6 bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                                    <h3 className="font-bold text-lg mb-3">Family Totals</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        <div>
                                            <p className="text-gray-600 text-sm">Total Due</p>
                                            <p className="font-bold text-xl">Rs. {familyData.totals.total_due}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 text-sm">Total Paid</p>
                                            <p className="font-bold text-xl text-green-600">Rs. {familyData.totals.total_paid}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 text-sm">Total Balance</p>
                                            <p className="font-bold text-2xl text-red-600">Rs. {familyData.totals.total_balance}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
};

// Simple Icon Component
const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);

export default FeeCollection;
