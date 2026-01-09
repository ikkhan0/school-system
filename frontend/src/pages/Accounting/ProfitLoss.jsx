import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Download, Printer, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const ProfitLoss = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
        end_date: new Date().toISOString().split('T')[0]
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = user?.token;
            const response = await axios.get(`${API_URL}/api/accounting/reports/profit-loss`, {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setReport(response.data);
        } catch (error) {
            toast.error('Failed to generate report');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h1>
                        <p className="text-gray-500 mt-1">Income Statement</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            <Printer size={18} />
                            <span>Print</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
                    <div className="flex gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <button
                            onClick={fetchReport}
                            className="mb-[1px] px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Generate Report
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                {report ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
                        <div className="p-8">
                            <h2 className="text-center text-xl font-bold text-gray-900 mb-2">{user?.school_name || 'School Name'}</h2>
                            <h3 className="text-center text-lg text-gray-700 mb-6">Profit & Loss Statement</h3>
                            <p className="text-center text-sm text-gray-500 mb-8">
                                From {new Date(filters.start_date).toLocaleDateString()} To {new Date(filters.end_date).toLocaleDateString()}
                            </p>

                            {/* Income Section */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-green-700 mb-4 border-b pb-2">Income (Revenue)</h4>
                                <table className="w-full">
                                    <tbody>
                                        {report.income.length > 0 ? report.income.map((item, idx) => (
                                            <tr key={idx} className="border-b border-dashed border-gray-100">
                                                <td className="py-2 text-gray-700">{item.code} - {item.name}</td>
                                                <td className="py-2 text-right font-medium">{item.balance.toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr><td className="py-2 text-gray-500 italic">No income recorded</td></tr>
                                        )}
                                        <tr className="bg-gray-50 font-bold">
                                            <td className="py-3 pl-2">Total Operating Income</td>
                                            <td className="py-3 pr-2 text-right text-green-700">{report.totalIncome.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Expense Section */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-red-700 mb-4 border-b pb-2">Operating Expenses</h4>
                                <table className="w-full">
                                    <tbody>
                                        {report.expense.length > 0 ? report.expense.map((item, idx) => (
                                            <tr key={idx} className="border-b border-dashed border-gray-100">
                                                <td className="py-2 text-gray-700">{item.code} - {item.name}</td>
                                                <td className="py-2 text-right font-medium">{item.balance.toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr><td className="py-2 text-gray-500 italic">No expenses recorded</td></tr>
                                        )}
                                        <tr className="bg-gray-50 font-bold">
                                            <td className="py-3 pl-2">Total Operating Expenses</td>
                                            <td className="py-3 pr-2 text-right text-red-700">{report.totalExpense.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Net Profit */}
                            <div className="mt-8 pt-4 border-t-2 border-gray-800">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span>Net Profit / (Loss)</span>
                                    <span className={report.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                                        {report.netProfit.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Select date range and click Generate Report</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfitLoss;
