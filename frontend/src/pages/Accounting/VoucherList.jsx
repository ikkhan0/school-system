import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Search, Eye, FileText, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const VoucherList = () => {
    const { user } = useContext(AuthContext);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        type: ''
    });

    const fetchVouchers = async () => {
        try {
            const token = user?.token;
            const response = await axios.get(`${API_URL}/api/accounting/vouchers`, {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setVouchers(response.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load vouchers');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, [filters]);

    // View details (Modal or Expansion could be implemented here)
    const handleViewVoucher = async (id) => {
        // For now, let's just log or maybe show a toast. Ideally, open a modal with details.
        try {
            const token = user?.token;
            const res = await axios.get(`${API_URL}/api/accounting/vouchers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Simple alert for now as a placeholder for a Modal
            alert(`Voucher: ${res.data.voucher.voucher_no}\nEntries: ${res.data.details.length}\nTotal: ${res.data.details.reduce((s, d) => s + d.debit, 0)}`);
        } catch (error) {
            toast.error('Failed to fetch details');
        }
    };

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Voucher List</h1>
                    <p className="text-gray-500 mt-1">History of financial transactions</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Filters */}
                    <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-gray-400" />
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            <option value="">All Types</option>
                            <option value="CPV">Cash Payment (CPV)</option>
                            <option value="CRV">Cash Receipt (CRV)</option>
                            <option value="BPV">Bank Payment (BPV)</option>
                            <option value="BRV">Bank Receipt (BRV)</option>
                            <option value="JV">Journal (JV)</option>
                        </select>
                        <button
                            onClick={fetchVouchers}
                            className="ml-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Voucher No</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading vouchers...</td></tr>
                                ) : vouchers.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No vouchers found</td></tr>
                                ) : (
                                    vouchers.map((voucher) => (
                                        <tr key={voucher._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(voucher.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-blue-600 font-mono">{voucher.voucher_no}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${['CPV', 'BPV'].includes(voucher.type) ? 'bg-red-50 text-red-600' :
                                                        ['CRV', 'BRV'].includes(voucher.type) ? 'bg-green-50 text-green-600' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {voucher.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{voucher.description}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                    {voucher.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleViewVoucher(voucher._id)}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherList;
