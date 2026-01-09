import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Search, Folder, FileText, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';
import AuthContext from '../../context/AuthContext';

const ChartOfAccounts = () => {
    const { user } = useContext(AuthContext);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'ASSET',
        parent_id: '',
    });

    const fetchAccounts = async () => {
        try {
            const token = user?.token;
            const response = await axios.get(`${API_URL}/api/accounting/accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAccounts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load accounts');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleSetupDefaults = async () => {
        if (!window.confirm('This will create default accounts (Cash, Bank, Tuition Fee, etc.). Continue?')) return;
        try {
            const token = user?.token;
            await axios.post(`${API_URL}/api/accounting/setup-defaults`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Default accounts created');
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to setup defaults');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = user?.token;
            await axios.post(`${API_URL}/api/accounting/accounts`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Account created successfully');
            setIsModalOpen(false);
            setFormData({ name: '', code: '', type: 'ASSET', parent_id: '' });
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create account');
        }
    };

    // Helper to group accounts by type
    const groupedAccounts = {
        ASSET: accounts.filter(a => a.type === 'ASSET'),
        LIABILITY: accounts.filter(a => a.type === 'LIABILITY'),
        EQUITY: accounts.filter(a => a.type === 'EQUITY'),
        INCOME: accounts.filter(a => a.type === 'INCOME'),
        EXPENSE: accounts.filter(a => a.type === 'EXPENSE'),
    };

    const AccountList = ({ title, items, colorClass }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${colorClass} bg-opacity-5`}>
                <h3 className={`font-bold ${colorClass}`}>{title}</h3>
                <span className="text-xs font-medium text-gray-500">{items.length} Accounts</span>
            </div>
            <div className="divide-y divide-gray-50">
                {items.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">No accounts found</div>
                ) : (
                    items
                        .filter(acc => acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || acc.code.includes(searchTerm))
                        .map(acc => (
                            <div key={acc._id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    {acc.parent_id ? <FileText size={16} className="text-gray-400" /> : <Folder size={18} className="text-blue-400" />}
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">{acc.code} - {acc.name}</span>
                                        {acc.is_system && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded border border-gray-200 uppercase tracking-wider">
                                                System
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Actions could go here */}
                            </div>
                        ))
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
                        <p className="text-gray-500 mt-1">Manage financial accounts and stricture</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {accounts.length === 0 && (
                        <button
                            onClick={handleSetupDefaults}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw size={18} />
                            <span>Setup Defaults</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>Add New Account</span>
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading accounts...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <AccountList title="Assets" items={groupedAccounts.ASSET} colorClass="text-green-600" />
                            <AccountList title="Expenses" items={groupedAccounts.EXPENSE} colorClass="text-red-600" />
                        </div>
                        <div className="space-y-6">
                            <AccountList title="Liabilities" items={groupedAccounts.LIABILITY} colorClass="text-orange-600" />
                            <AccountList title="Equity" items={groupedAccounts.EQUITY} colorClass="text-purple-600" />
                            <AccountList title="Income" items={groupedAccounts.INCOME} colorClass="text-blue-600" />
                        </div>
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Account</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 5005"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Maintenance Expense"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                    >
                                        <option value="ASSET">Asset</option>
                                        <option value="LIABILITY">Liability</option>
                                        <option value="EQUITY">Equity</option>
                                        <option value="INCOME">Income</option>
                                        <option value="EXPENSE">Expense</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartOfAccounts;
