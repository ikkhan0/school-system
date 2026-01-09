import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const TrialBalance = () => {
    const { user } = useContext(AuthContext);
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        try {
            const token = user?.token;
            // Assuming we pass filters later, for now fetching all time trial balance
            const response = await axios.get(`${API_URL}/api/accounting/reports/trial-balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReport(response.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load trial balance');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const totalDebit = report.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = report.reduce((sum, item) => sum + item.credit, 0);

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
                        <p className="text-gray-500 mt-1">Summary of all account balances</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchReport} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <RefreshCw size={20} />
                        </button>
                        <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2 font-medium">
                            <Download size={18} />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Debit</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Credit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading report...</td></tr>
                                ) : report.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No data found in general ledger</td></tr>
                                ) : (
                                    report.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm font-mono text-gray-600">{row.code}</td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                                            <td className="px-6 py-3 text-sm text-gray-500">{row.type}</td>
                                            <td className="px-6 py-3 text-right text-sm font-mono">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                                            <td className="px-6 py-3 text-right text-sm font-mono">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-right uppercase text-sm text-gray-600">Total</td>
                                    <td className="px-6 py-4 text-right text-sm font-mono text-blue-600">{totalDebit.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-sm font-mono text-blue-600">{totalCredit.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialBalance;
