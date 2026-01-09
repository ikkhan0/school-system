import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Download, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const BalanceSheet = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = user?.token;
            const response = await axios.get(`${API_URL}/api/accounting/reports/balance-sheet`, {
                params: { as_of_date: asOfDate },
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
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
                        <p className="text-gray-500 mt-1">Statement of Financial Position</p>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
                            <input
                                type="date"
                                value={asOfDate}
                                onChange={(e) => setAsOfDate(e.target.value)}
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <h2 className="text-center text-xl font-bold text-gray-900 mb-2">{user?.school_name || 'School Name'}</h2>
                            <h3 className="text-center text-lg text-gray-700 mb-6">Balance Sheet</h3>
                            <p className="text-center text-sm text-gray-500 mb-8">
                                As of {new Date(asOfDate).toLocaleDateString()}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Assets */}
                                <div>
                                    <h4 className="text-lg font-bold text-blue-800 bg-blue-50 p-2 rounded mb-4">ASSETS</h4>

                                    <table className="w-full">
                                        <tbody>
                                            {report.assets.length > 0 ? report.assets.map((item, idx) => (
                                                <tr key={idx} className="border-b border-dashed border-gray-100">
                                                    <td className="py-2 text-gray-700">{item.code} - {item.name}</td>
                                                    <td className="py-2 text-right font-medium text-gray-900">{item.balance.toLocaleString()}</td>
                                                </tr>
                                            )) : (
                                                <tr><td className="py-2 text-gray-500 italic">No assets</td></tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-blue-200">
                                                <td className="py-3 font-bold text-gray-900">Total Assets</td>
                                                <td className="py-3 text-right font-bold text-blue-700">{report.totalAssets.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Right Column: Liabilities & Equity */}
                                <div>
                                    <h4 className="text-lg font-bold text-red-800 bg-red-50 p-2 rounded mb-4">LIABILITIES</h4>

                                    <table className="w-full mb-8">
                                        <tbody>
                                            {report.liabilities.length > 0 ? report.liabilities.map((item, idx) => (
                                                <tr key={idx} className="border-b border-dashed border-gray-100">
                                                    <td className="py-2 text-gray-700">{item.code} - {item.name}</td>
                                                    <td className="py-2 text-right font-medium text-gray-900">{item.balance.toLocaleString()}</td>
                                                </tr>
                                            )) : (
                                                <tr><td className="py-2 text-gray-500 italic">No liabilities</td></tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-red-200 bg-red-50/50">
                                                <td className="py-2 pl-2 font-semibold text-gray-700">Total Liabilities</td>
                                                <td className="py-2 pr-2 text-right font-semibold text-red-700">{report.totalLiabilities.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <h4 className="text-lg font-bold text-purple-800 bg-purple-50 p-2 rounded mb-4">EQUITY</h4>
                                    <table className="w-full">
                                        <tbody>
                                            {report.equity.length > 0 ? report.equity.map((item, idx) => (
                                                <tr key={idx} className="border-b border-dashed border-gray-100">
                                                    <td className="py-2 text-gray-700">{item.code ? `${item.code} - ` : ''}{item.name}</td>
                                                    <td className="py-2 text-right font-medium text-gray-900">{item.balance.toLocaleString()}</td>
                                                </tr>
                                            )) : (
                                                <tr><td className="py-2 text-gray-500 italic">No equity accounts</td></tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-purple-200 bg-purple-50/50">
                                                <td className="py-2 pl-2 font-semibold text-gray-700">Total Equity</td>
                                                <td className="py-2 pr-2 text-right font-semibold text-purple-700">{report.totalEquity.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    {/* Grand Total */}
                                    <div className="mt-8 pt-4 border-t-2 border-gray-800">
                                        <div className="flex justify-between items-center font-bold">
                                            <span>Total Liabilities & Equity</span>
                                            <span className={(report.totalLiabilities + report.totalEquity) === report.totalAssets ? "text-blue-700" : "text-red-600"}>
                                                {(report.totalLiabilities + report.totalEquity).toLocaleString()}
                                            </span>
                                        </div>
                                        {(report.totalLiabilities + report.totalEquity) !== report.totalAssets && (
                                            <p className="text-xs text-red-500 mt-1 text-right">Warning: Balance Sheet is out of balance</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Select date and click Generate Report</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BalanceSheet;
