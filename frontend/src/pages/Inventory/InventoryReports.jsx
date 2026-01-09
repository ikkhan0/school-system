import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Search, Calendar, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const InventoryReports = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('stock'); // stock, purchase, issue
    const [loading, setLoading] = useState(false);

    // Data States
    const [stockData, setStockData] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Filters
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = user?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (activeTab === 'stock') {
                const response = await axios.get(`${API_URL}/api/inventory/items`, config);
                setStockData(response.data);
            } else {
                // Fetch Transactions (Purchase or Issue)
                const type = activeTab === 'purchase' ? 'PURCHASE' : 'ISSUE';
                const response = await axios.get(`${API_URL}/api/inventory/transactions`, {
                    params: {
                        start_date: dateRange.startDate,
                        end_date: dateRange.endDate,
                        type: type
                    },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTransactions(response.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, dateRange]); // Refetch on tab or date change

    // Filtering
    const filteredStock = stockData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTransactions = transactions.filter(t =>
        t.item_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
                    <p className="text-gray-500 mt-1">View stock levels and transaction history</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-t-xl border-b border-gray-200 px-6 pt-4 flex space-x-6">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'stock' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Stock Report
                        {activeTab === 'stock' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('purchase')}
                        className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'purchase' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Add Item (Purchase) Report
                        {activeTab === 'purchase' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('issue')}
                        className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'issue' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Issue Item Report
                        {activeTab === 'issue' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                    </button>
                </div>

                <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 p-6 min-h-[500px]">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex-1 relative min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {activeTab !== 'stock' && (
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                        className="pl-3 pr-2 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <span className="text-gray-400">-</span>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                        className="pl-3 pr-2 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <Download size={18} />
                            <span>Export CSV</span>
                        </button>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 rounded-lg">
                                <tr>
                                    {activeTab === 'stock' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Available Stock</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                                        </>
                                    )}
                                    {activeTab === 'purchase' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Store</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Cost</th>
                                        </>
                                    )}
                                    {activeTab === 'issue' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Issued To</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading Report...</td></tr>
                                ) : (activeTab === 'stock' ? filteredStock : filteredTransactions).length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No records found</td></tr>
                                ) : (
                                    (activeTab === 'stock' ? filteredStock : filteredTransactions).map((row, idx) => (
                                        <tr key={row._id || idx} className="hover:bg-gray-50">
                                            {activeTab === 'stock' && (
                                                <>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{row.category_id?.name || '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{row.unit}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{row.current_stock}</td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-500">{row.unit_price}</td>
                                                </>
                                            )}
                                            {activeTab === 'purchase' && (
                                                <>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(row.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.item_id?.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{row.supplier_id?.name || '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{row.store_id?.name || '-'}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">+{row.quantity}</td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-500">{row.total_cost}</td>
                                                </>
                                            )}
                                            {activeTab === 'issue' && (
                                                <>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(row.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.item_id?.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {row.issued_to_name}
                                                        {row.issued_to_user?.full_name ? '' : '' /* Use name if user link fail */}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{row.department || '-'}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold text-red-600">-{row.quantity}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${row.status === 'RETURNED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
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

export default InventoryReports;
