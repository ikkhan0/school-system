import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import SettingsContext from '../context/SettingsContext';
import { formatDate } from '../utils/dateFormatter';
import { Printer, Edit, Save, X } from 'lucide-react';
import API_URL from '../config';

const FeeVoucher = () => {
    const { student_id, month } = useParams();
    const { user } = useContext(AuthContext);
    const { dateFormat } = useContext(SettingsContext);
    const [voucherData, setVoucherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [manualDiscount, setManualDiscount] = useState(0);
    const [discountReason, setDiscountReason] = useState('');

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

            // Set existing manual discount if any
            if (response.data.fee.discount_applied) {
                setManualDiscount(response.data.fee.discount_applied.manual_discount || 0);
                setDiscountReason(response.data.fee.discount_applied.discount_reason || '');
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching voucher:', error);
            setLoading(false);
        }
    };

    const handleSaveDiscount = async () => {
        try {
            await axios.put(`${API_URL}/api/fees/${voucherData.fee._id}/discount`, {
                manual_discount: parseFloat(manualDiscount),
                discount_reason: discountReason
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            alert('Discount updated successfully!');
            setShowDiscountModal(false);
            fetchVoucher(); // Refresh data
        } catch (error) {
            console.error('Error updating discount:', error);
            alert('Failed to update discount');
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

    // Calculate discount breakdown
    const policyDiscount = fee.discount_applied?.policy_discount || 0;
    const currentManualDiscount = fee.discount_applied?.manual_discount || 0;
    const totalDiscount = policyDiscount + currentManualDiscount;
    const originalAmount = fee.original_amount || fee.gross_amount;
    const finalAmount = originalAmount - totalDiscount;

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Action Buttons */}
            <div className="no-print mb-4 flex justify-end gap-2">
                <button
                    onClick={() => setShowDiscountModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                    <Edit size={20} />
                    Edit Discount
                </button>
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
                        <p className="text-sm"><span className="font-bold">Issue Date:</span> {formatDate(new Date(), dateFormat)}</p>
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
                            <td className="border-2 border-black p-3">{fee.title || 'Tuition Fee'}</td>
                            <td className="border-2 border-black p-3 text-right font-semibold">{fee.tuition_fee}</td>
                        </tr>
                        {fee.other_charges > 0 && (
                            <tr>
                                <td className="border-2 border-black p-3">Other Charges</td>
                                <td className="border-2 border-black p-3 text-right">{fee.other_charges}</td>
                            </tr>
                        )}
                        {fee.outstanding_funds?.map((fund, idx) => (
                            <tr key={'fund' + idx} className="bg-yellow-50">
                                <td className="border-2 border-black p-3">{fund.title}</td>
                                <td className="border-2 border-black p-3 text-right font-semibold">{fund.amount}</td>
                            </tr>
                        ))}
                        {fee.arrears > 0 && (
                            <tr>
                                <td className="border-2 border-black p-3">Arrears</td>
                                <td className="border-2 border-black p-3 text-right text-red-600 font-semibold">{fee.arrears}</td>
                            </tr>
                        )}

                        {/* Discount Breakdown */}
                        {policyDiscount > 0 && (
                            <tr className="bg-green-50">
                                <td className="border-2 border-black p-3">
                                    Policy Discount
                                    {student.discount_category && student.discount_category !== 'None' && (
                                        <span className="text-xs text-gray-600 ml-2">({student.discount_category})</span>
                                    )}
                                </td>
                                <td className="border-2 border-black p-3 text-right text-green-600 font-semibold">-{policyDiscount}</td>
                            </tr>
                        )}
                        {currentManualDiscount > 0 && (
                            <tr className="bg-green-50">
                                <td className="border-2 border-black p-3">
                                    Manual Discount
                                    {fee.discount_applied?.discount_reason && (
                                        <span className="text-xs text-gray-600 ml-2">({fee.discount_applied.discount_reason})</span>
                                    )}
                                </td>
                                <td className="border-2 border-black p-3 text-right text-green-600 font-semibold">-{currentManualDiscount}</td>
                            </tr>
                        )}

                        {/* Legacy concession field */}
                        {fee.concession > 0 && (
                            <tr>
                                <td className="border-2 border-black p-3">Concession</td>
                                <td className="border-2 border-black p-3 text-right text-green-600">-{fee.concession}</td>
                            </tr>
                        )}

                        <tr className="bg-gray-100">
                            <td className="border-2 border-black p-3 font-bold text-lg">TOTAL PAYABLE</td>
                            <td className="border-2 border-black p-3 text-right font-bold text-xl">
                                Rs. {(fee.balance || fee.final_amount || fee.gross_amount) + (fee.arrears || 0)}
                            </td>
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
                        <p className="text-sm font-bold">Due Date: {formatDate(new Date(new Date().setDate(new Date().getDate() + 10)), dateFormat)}</p>
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

            {/* Discount Edit Modal */}
            {showDiscountModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Edit Discount</h2>
                            <button onClick={() => setShowDiscountModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Original Amount */}
                            <div className="bg-gray-100 p-3 rounded">
                                <p className="text-sm text-gray-600">Original Fee Amount</p>
                                <p className="text-2xl font-bold">Rs. {originalAmount}</p>
                            </div>

                            {/* Policy Discount (Read-only) */}
                            {policyDiscount > 0 && (
                                <div className="bg-green-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Policy Discount ({student.discount_category})</p>
                                    <p className="text-xl font-bold text-green-700">- Rs. {policyDiscount}</p>
                                </div>
                            )}

                            {/* Manual Discount (Editable) */}
                            <div>
                                <label className="block text-sm font-semibold mb-1">Additional Manual Discount (Rs.)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={originalAmount - policyDiscount}
                                    value={manualDiscount}
                                    onChange={(e) => setManualDiscount(e.target.value)}
                                    className="w-full p-2 border-2 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter discount amount"
                                />
                            </div>

                            {/* Discount Reason */}
                            <div>
                                <label className="block text-sm font-semibold mb-1">Reason for Discount</label>
                                <input
                                    type="text"
                                    value={discountReason}
                                    onChange={(e) => setDiscountReason(e.target.value)}
                                    className="w-full p-2 border-2 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Financial hardship, Special case"
                                />
                            </div>

                            {/* Calculation Summary */}
                            <div className="border-t-2 pt-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Original Amount:</span>
                                    <span className="font-semibold">Rs. {originalAmount}</span>
                                </div>
                                {policyDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Policy Discount:</span>
                                        <span className="font-semibold">- Rs. {policyDiscount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Manual Discount:</span>
                                    <span className="font-semibold">- Rs. {manualDiscount || 0}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t-2 pt-2">
                                    <span>Final Amount:</span>
                                    <span className="text-blue-600">Rs. {originalAmount - policyDiscount - (parseFloat(manualDiscount) || 0)}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowDiscountModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveDiscount}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <Save size={18} />
                                    Save & Update
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
