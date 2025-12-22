import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Printer } from 'lucide-react';
import API_URL from '../config';

const FeeVoucher = () => {
    const { student_id, month } = useParams();
    const { user } = useContext(AuthContext);
    const [voucherData, setVoucherData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchVoucher();
    }, [student_id, month, user]);

    const fetchVoucher = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/fees/voucher/${student_id}/${month}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setVoucherData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching voucher:', error);
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!voucherData) {
        return <div className="flex items-center justify-center h-screen">Voucher not found</div>;
    }

    const { student, fee, school } = voucherData;

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Print Button */}
            <div className="no-print mb-4 flex justify-end">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <Printer size={20} />
                    Print Voucher
                </button>
            </div>

            {/* Fee Voucher */}
            <div className="bg-white border-4 border-black p-8">
                {/* Header */}
                <div className="text-center border-b-4 border-black pb-4 mb-6">
                    <h1 className="text-3xl font-bold uppercase tracking-wider">{school?.name || 'School Name'}</h1>
                    <p className="text-sm mt-1">{school?.address || 'School Address'}</p>
                    <p className="text-sm">Phone: {school?.phone || 'N/A'} | Email: {school?.email || 'N/A'}</p>
                    <div className="mt-3 inline-block border-2 border-black px-6 py-2 bg-gray-100">
                        <h2 className="text-xl font-bold">FEE VOUCHER - {fee.month}</h2>
                    </div>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-sm"><span className="font-bold">Student Name:</span> {student.full_name}</p>
                        <p className="text-sm"><span className="font-bold">Father Name:</span> {student.father_name || student.family_id?.father_name}</p>
                        <p className="text-sm"><span className="font-bold">Roll Number:</span> {student.roll_no}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm"><span className="font-bold">Class:</span> {student.class_id}-{student.section_id}</p>
                        <p className="text-sm"><span className="font-bold">Mobile:</span> {student.family_id?.father_mobile || student.father_mobile}</p>
                        <p className="text-sm"><span className="font-bold">Issue Date:</span> {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Fee Details Table */}
                <table className="w-full border-2 border-black mb-6">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border-2 border-black p-3 text-left">Description</th>
                            <th className="border-2 border-black p-3 text-right">Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border-2 border-black p-3">Tuition Fee</td>
                            <td className="border-2 border-black p-3 text-right font-semibold">{fee.tuition_fee}</td>
                        </tr>
                        {fee.other_charges > 0 && (
                            <tr>
                                <td className="border-2 border-black p-3">Other Charges</td>
                                <td className="border-2 border-black p-3 text-right">{fee.other_charges}</td>
                            </tr>
                        )}
                        {fee.arrears > 0 && (
                            <tr>
                                <td className="border-2 border-black p-3">Arrears</td>
                                <td className="border-2 border-black p-3 text-right text-red-600 font-semibold">{fee.arrears}</td>
                            </tr>
                        )}
                        {fee.concession > 0 && (
                            <tr>
                                <td className="border-2 border-black p-3">Concession</td>
                                <td className="border-2 border-black p-3 text-right text-green-600">-{fee.concession}</td>
                            </tr>
                        )}
                        <tr className="bg-gray-100">
                            <td className="border-2 border-black p-3 font-bold text-lg">TOTAL PAYABLE</td>
                            <td className="border-2 border-black p-3 text-right font-bold text-xl">Rs. {fee.gross_amount}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Payment Status */}
                {fee.paid_amount > 0 && (
                    <div className="mb-6 p-4 bg-green-50 border-2 border-green-600">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm"><span className="font-bold">Paid Amount:</span> Rs. {fee.paid_amount}</p>
                                <p className="text-sm"><span className="font-bold">Balance:</span> Rs. {fee.balance}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm"><span className="font-bold">Status:</span>
                                    <span className={`ml-2 px-3 py-1 rounded ${fee.status === 'Paid' ? 'bg-green-600 text-white' :
                                            fee.status === 'Partial' ? 'bg-yellow-600 text-white' :
                                                'bg-red-600 text-white'
                                        }`}>
                                        {fee.status}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="border-t-2 border-black pt-4 mb-6">
                    <h3 className="font-bold mb-2">Payment Instructions:</h3>
                    <ul className="text-sm list-disc list-inside space-y-1">
                        <li>Please pay the fee before the due date to avoid late fee charges</li>
                        <li>Late fee of Rs. 100 will be charged after the due date</li>
                        <li>Keep this voucher for your records</li>
                        <li>For any queries, contact the school office</li>
                    </ul>
                </div>

                {/* Footer */}
                <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
                    <div>
                        <p className="text-sm font-bold">Due Date: {new Date(new Date().setDate(new Date().getDate() + 10)).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-600 mt-2">This is a computer-generated voucher</p>
                    </div>
                    <div className="text-right">
                        <div className="inline-block">
                            <div className="border-t-2 border-black pt-2 mt-8">
                                <p className="text-sm font-semibold">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    );
};

export default FeeVoucher;
