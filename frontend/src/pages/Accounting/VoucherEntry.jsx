import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const VoucherEntry = () => {
    const { user } = useContext(AuthContext);
    const [accounts, setAccounts] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('CPV'); // Cash Payment Voucher default
    const [mainDescription, setMainDescription] = useState('');

    // Rows
    const [rows, setRows] = useState([
        { account_id: '', description: '', debit: 0, credit: 0 },
        { account_id: '', description: '', debit: 0, credit: 0 }
    ]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const token = user?.token;
                const response = await axios.get(`${API_URL}/api/accounting/accounts`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAccounts(response.data);
            } catch (error) {
                toast.error('Failed to load accounts');
            }
        };
        fetchAccounts();
    }, []);

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const addRow = () => {
        setRows([...rows, { account_id: '', description: '', debit: 0, credit: 0 }]);
    };

    const removeRow = (index) => {
        if (rows.length <= 2) {
            toast.error('Minimum 2 rows required for double entry');
            return;
        }
        const newRows = rows.filter((_, i) => i !== index);
        setRows(newRows);
    };

    const calculateTotals = () => {
        const totalDebit = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
        const totalCredit = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
        return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
    };

    const { totalDebit, totalCredit, difference } = calculateTotals();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Math.abs(difference) > 0.01) {
            toast.error(`Voucher is not balanced. Difference: ${difference.toFixed(2)}`);
            return;
        }

        if (totalDebit === 0) {
            toast.error('Voucher amount cannot be zero');
            return;
        }

        // Filter out empty rows if any (though UI enforces input usually)
        const validRows = rows.filter(r => r.account_id && (Number(r.debit) > 0 || Number(r.credit) > 0));

        if (validRows.length < 2) {
            toast.error('At least 2 valid entries required');
            return;
        }

        try {
            const token = user?.token;
            const payload = {
                date,
                type,
                description: mainDescription,
                entries: validRows
            };

            await axios.post(`${API_URL}/api/accounting/vouchers`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Voucher posted successfully');

            // Reset Form (keep date same for ease)
            setMainDescription('');
            setRows([
                { account_id: '', description: '', debit: 0, credit: 0 },
                { account_id: '', description: '', debit: 0, credit: 0 }
            ]);

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to post voucher');
        }
    };

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Voucher Entry</h1>
                    <p className="text-gray-500 mt-1">Record financial transactions</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-medium"
                            >
                                <option value="CPV">Cash Payment Voucher (CPV)</option>
                                <option value="CRV">Cash Receipt Voucher (CRV)</option>
                                <option value="BPV">Bank Payment Voucher (BPV)</option>
                                <option value="BRV">Bank Receipt Voucher (BRV)</option>
                                <option value="JV">Journal Voucher (JV)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Memo</label>
                            <input
                                type="text"
                                placeholder="Main voucher narration"
                                value={mainDescription}
                                onChange={(e) => setMainDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left w-12 text-xs font-semibold text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left w-1/3 text-xs font-semibold text-gray-500 uppercase">Account</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description (Optional)</th>
                                    <th className="px-4 py-3 text-right w-32 text-xs font-semibold text-gray-500 uppercase">Debit</th>
                                    <th className="px-4 py-3 text-right w-32 text-xs font-semibold text-gray-500 uppercase">Credit</th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-gray-400">{index + 1}</td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={row.account_id}
                                                onChange={(e) => handleRowChange(index, 'account_id', e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded text-sm bg-white"
                                            >
                                                <option value="">Select Account</option>
                                                {accounts.map(acc => (
                                                    <option key={acc._id} value={acc._id}>{acc.code} - {acc.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={row.description}
                                                onChange={(e) => handleRowChange(index, 'description', e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded text-sm"
                                                placeholder="Line item details"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.debit}
                                                onChange={(e) => {
                                                    handleRowChange(index, 'debit', e.target.value);
                                                    if (Number(e.target.value) > 0) handleRowChange(index, 'credit', 0);
                                                }}
                                                className="w-full p-2 border border-gray-200 rounded text-sm text-right font-mono"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.credit}
                                                onChange={(e) => {
                                                    handleRowChange(index, 'credit', e.target.value);
                                                    if (Number(e.target.value) > 0) handleRowChange(index, 'debit', 0);
                                                }}
                                                className="w-full p-2 border border-gray-200 rounded text-sm text-right font-mono"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button
                                                onClick={() => removeRow(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold text-sm">
                                <tr>
                                    <td colSpan="3" className="px-4 py-3 text-right text-gray-600 uppercase tracking-wider">Total</td>
                                    <td className="px-4 py-3 text-right font-mono">{totalDebit.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{totalCredit.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={addRow}
                            className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Plus size={18} />
                            <span>Add Row</span>
                        </button>

                        <div className="flex items-center gap-4">
                            {Math.abs(difference) > 0.01 && (
                                <span className="text-red-600 font-medium text-sm">
                                    Off by: {difference.toFixed(2)}
                                </span>
                            )}
                            <button
                                onClick={handleSubmit}
                                className={`px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium text-white shadow-sm ${Math.abs(difference) > 0.01
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                disabled={Math.abs(difference) > 0.01}
                            >
                                <Save size={20} />
                                <span>Post Voucher</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherEntry;
