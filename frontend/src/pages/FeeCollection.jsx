import { useState, useContext } from 'react';
import { Search, Printer, DollarSign, MessageCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const FeeCollection = () => {
    const { user } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [familyData, setFamilyData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentAmounts, setPaymentAmounts] = useState({});

    // Helper for WhatsApp
    const sendWhatsApp = (mobile, message) => {
        if (!mobile) return alert("Mobile Number not found!");
        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) {
            num = '92' + num.substring(1);
        }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/fees/family-view?search=${searchTerm}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();
            setFamilyData(data);

            const initialAmounts = {};
            data.students.forEach(item => {
                initialAmounts[item.student._id] = item.fee.balance;
            });
            setPaymentAmounts(initialAmounts);

        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        if (!familyData) return { totalConcession: 0, totalDue: 0, totalPaid: 0, balance: 0 };
        return {
            totalConcession: 0, // Mocked in original, can be updated if data exists
            totalDue: familyData.students.reduce((acc, curr) => acc + curr.fee.balance, 0),
            totalPaid: 0, // In this view, we are likely showing due amounts
            balance: familyData.students.reduce((acc, curr) => acc + curr.fee.balance, 0)
        };
    };

    const { totalDue, totalPaid, balance, totalConcession } = calculateTotals();

    const sendFeeReminder = (item) => {
        const msg = `Dear Parent,\n\nFee Reminder for ${item.student.full_name}.\nMonth: ${item.fee.month}\nTotal Due: ${item.fee.balance}\nPlease pay at your earliest convenience.\n\n- Bismillah Educational Complex`;
        const mobile = familyData.family?.father_mobile || item.student.father_mobile;
        sendWhatsApp(mobile, msg);
    };

    const sendFamilyReceipt = () => {
        if (!familyData) return;
        const mobile = familyData.family?.father_mobile;
        const month = familyData.students[0]?.fee.month || "Current";
        const msg = `Dear Parent,\n\nFamily Fee Details (${month}):\nTotal Due: ${totalDue}\nPaid: ${totalPaid}\nBalance: ${balance}\n\nThank you for your cooperation.\n- Bismillah Educational Complex`;
        sendWhatsApp(mobile, msg);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="no-print bg-white p-6 shadow rounded-lg mb-6">
                <h1 className="text-xl font-bold mb-4">Fee Collection</h1>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input type="text" placeholder="Search..." className="border p-2 rounded flex-1"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <button className="bg-blue-600 text-white px-4 rounded"><Search size={20} /></button>
                </form>
            </div>

            {familyData && (
                <div className="bg-white shadow rounded-lg p-8 border-2 border-black receipt-container">
                    <div className="text-center mb-6 relative">
                        <h2 className="font-bold text-2xl uppercase">BISMILLAH EDUCATIONAL COMPLEX</h2>
                        <p className="text-sm">Family Fee Slip - Month: 2025-12</p>
                        <p className="text-sm">Phone: 3007980055</p>

                        <div className="no-print absolute top-0 right-0 flex gap-2">
                            <button onClick={sendFamilyReceipt} className="text-green-600 hover:bg-green-50 p-2 rounded border border-green-200" title="Send Family Receipt">
                                <MessageCircle size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="dashed-line mb-6"></div>

                    <table className="w-full text-sm border-collapse border border-black mb-6">
                        <thead>
                            <tr className="bg-gray-100 font-bold uppercase text-xs">
                                <th className="border border-black p-2 text-left">NAME</th>
                                <th className="border border-black p-2 text-center">CLASS</th>
                                <th className="border border-black p-2 text-right">FEE</th>
                                <th className="border border-black p-2 text-right">CONCESSION</th>
                                <th className="border border-black p-2 text-right">EXTRA</th>
                                <th className="border border-black p-2 text-right">ARREARS</th>
                                <th className="border border-black p-2 text-right">TOTAL DUE</th>
                                <th className="border border-black p-2 text-right">PAID</th>
                                <th className="border border-black p-2 text-center no-print">MSG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {familyData.students.map((item) => (
                                <tr key={item.student._id} className="text-xs">
                                    <td className="border border-black p-2 font-bold">{item.student.full_name}</td>
                                    <td className="border border-black p-2 text-center">{item.student.class_id}</td>
                                    <td className="border border-black p-2 text-right">{item.fee.tuition_fee}</td>
                                    <td className="border border-black p-2 text-right text-purple-600">{item.fee.concession || 0}</td>
                                    <td className="border border-black p-2 text-right">0</td>
                                    <td className="border border-black p-2 text-right">{item.fee.arrears}</td>
                                    <td className="border border-black p-2 text-right font-bold">{item.fee.balance}</td>
                                    <td className="border border-black p-2 text-right bg-gray-50">
                                        <span className="no-print">
                                            <input className="w-16 text-right border" defaultValue={0} />
                                        </span>
                                        <span className="print-only">0</span>
                                    </td>
                                    <td className="border border-black p-2 text-center no-print">
                                        <button onClick={() => sendFeeReminder(item)} className="text-green-600 hover:text-green-800">
                                            <MessageCircle size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={6} className="text-right font-bold p-2">Total Concession:</td>
                                <td className="text-right font-bold p-2 text-purple-600">{totalConcession}</td>
                                <td></td>
                                <td className="no-print"></td>
                            </tr>
                            <tr>
                                <td colSpan={6} className="text-right font-bold p-2">Family Total Due:</td>
                                <td className="text-right font-bold p-2 text-lg">{totalDue}</td>
                                <td></td>
                                <td className="no-print"></td>
                            </tr>
                            <tr>
                                <td colSpan={6} className="text-right font-bold p-2">Family Total Paid:</td>
                                <td className="text-right font-bold p-2">{totalPaid}</td>
                                <td></td>
                                <td className="no-print"></td>
                            </tr>
                            <tr>
                                <td colSpan={6} className="text-right font-bold p-2 text-red-600 text-xl">Balance:</td>
                                <td className="text-right font-bold p-2 text-red-600 text-xl">{totalDue - totalPaid}</td>
                                <td></td>
                                <td className="no-print"></td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Add Fee Section */}
                    <div className="no-print mt-8 pt-8 border-t">
                        <h3 className="text-lg font-bold mb-4">Add Manual Fee</h3>
                        <div className="flex gap-4 items-end bg-gray-50 p-4 rounded">
                            <div className="flex-1">
                                <label className="block text-sm mb-1">Student</label>
                                <select id="studentSelect" className="w-full p-2 border rounded">
                                    {familyData.students.map(item => (
                                        <option key={item.student._id} value={item.student._id}>{item.student.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm mb-1">Amount</label>
                                <input id="feeAmount" type="number" className="w-full p-2 border rounded" placeholder="5000" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm mb-1">Month</label>
                                <input id="feeMonth" type="text" className="w-full p-2 border rounded" defaultValue="Jan-2025" />
                            </div>
                            <button onClick={async () => {
                                const studentId = document.getElementById('studentSelect').value;
                                const amount = document.getElementById('feeAmount').value;
                                const month = document.getElementById('feeMonth').value;
                                if (!amount) return;

                                try {
                                    await fetch('http://localhost:5000/api/fees/add', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${user.token}`
                                        },
                                        body: JSON.stringify({
                                            student_id: studentId,
                                            amount: Number(amount),
                                            month: month,
                                            description: 'Manual Entry'
                                        })
                                    });
                                    // Refresh search
                                    document.querySelector('form button').click(); // trigger search again
                                    alert('Fee Added');
                                } catch (e) {
                                    console.error(e);
                                    alert('Error adding fee');
                                }
                            }} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                                Add Fee
                            </button>
                        </div>
                    </div>

                    <div className="text-center text-xs text-gray-400 mt-8 mb-4">
                        Generated on {new Date().toLocaleDateString()}
                    </div>
                </div>
            )}
            <style>
                {`
                    .dashed-line { border-bottom: 1px dashed black; }
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white; -webkit-print-color-adjust: exact; }
                        .receipt-container { 
                            border: 2px solid black !important;
                            width: 100%;
                        }
                    }
                `}
            </style>
        </div>
    );
};
export default FeeCollection;
