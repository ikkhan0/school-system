import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Search, Download, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const GeneralLedger = () => {
    const { user } = useContext(AuthContext);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const [filters, setFilters] = useState({
        account_id: '',
        start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

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

    const fetchReport = async () => {
        if (!filters.account_id) return;
        setLoading(true);
        try {
            const token = user?.token;
            const response = await axios.get(`${API_URL}/api/accounting/reports/ledger`, {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(response.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load ledger');
            setLoading(false);
        }
    };

    // Calculate Running Balance
    let runningBalance = reportData ? reportData.opening_balance : 0;

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
                        <p className="text-gray-500 mt-1">Detailed account transaction history</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            <Printer size={18} />
                            <span>Print</span>
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                            <Download size={18} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Account</label>
                            <select
                                value={filters.account_id}
                                onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            >
                                <option value="">Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc._id} value={acc._id}>{acc.code} - {acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <button
                                onClick={fetchReport}
                                disabled={!filters.account_id}
                                className="mb-[1px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {reportData && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Voucher</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Debit</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Credit</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {/* Opening Balance Row */}
                                    <tr className="bg-blue-50 font-medium">
                                        <td className="px-6 py-3 text-sm text-gray-900" colSpan="2">Opening Balance</td>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3 text-right text-sm text-gray-900">
                                            {runningBalance > 0 ? runningBalance.toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-gray-900">
                                            {runningBalance < 0 ? Math.abs(runningBalance).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm font-bold text-blue-700">
                                            {runningBalance.toLocaleString()}
                                        </td>
                                    </tr>

                                    {/* Transactions */}
                                    {reportData.transactions.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-gray-500">No transactions in this period</td></tr>
                                    ) : (
                                        reportData.transactions.map((t, idx) => {
                                            runningBalance += (t.debit - t.credit);
                                            return (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3 text-sm text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 text-sm text-blue-600 font-mono">{t.voucher_no}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-900">{t.description}</td>
                                                    <td className="px-6 py-3 text-right text-sm font-mono">{t.debit > 0 ? t.debit.toLocaleString() : '-'}</td>
                                                    <td className="px-6 py-3 text-right text-sm font-mono">{t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
                                                    <td className="px-6 py-3 text-right text-sm font-mono font-medium text-gray-900">{runningBalance.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralLedger;
