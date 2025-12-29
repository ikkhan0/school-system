import { useState, useEffect, useContext } from 'react';
import { Edit, Trash2, Upload, FileText } from 'lucide-react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import SettingsContext from '../context/SettingsContext';
import { formatDate, toInputDate } from '../utils/dateFormatter';
import API_URL from '../config';

const Expenses = () => {
    const { user } = useContext(AuthContext);
    const { dateFormat } = useContext(SettingsContext);
    const [expenses, setExpenses] = useState([]);
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [formData, setFormData] = useState({
        expense_head_id: '',
        name: '',
        description: '',
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        amount: ''
    });
    const [attachment, setAttachment] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) {
            fetchExpenses();
            fetchExpenseHeads();
        }
    }, [user]);

    const fetchExpenses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/expenses`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setExpenses(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchExpenseHeads = async () => {
        try {
            const res = await fetch(`${API_URL}/api/expenses/heads`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setExpenseHeads(data);
            if (data.length > 0 && !formData.expense_head_id) {
                setFormData(prev => ({ ...prev, expense_head_id: data[0]._id }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('expense_head_id', formData.expense_head_id);
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('invoice_number', formData.invoice_number);
            formDataToSend.append('date', formData.date);
            formDataToSend.append('amount', formData.amount);

            if (attachment) {
                formDataToSend.append('attachment', attachment);
            }

            const url = editingId
                ? `${API_URL}/api/expenses/${editingId}`
                : `${API_URL}/api/expenses`;

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    Authorization: `Bearer ${user.token}`
                },
                body: formDataToSend
            });

            const data = await res.json();

            if (res.ok) {
                alert(editingId ? 'Expense Updated!' : 'Expense Added!');
                resetForm();
                fetchExpenses();
            } else {
                alert(data.message || 'Failed to save expense');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            expense_head_id: expenseHeads.length > 0 ? expenseHeads[0]._id : '',
            name: '',
            description: '',
            invoice_number: '',
            date: new Date().toISOString().split('T')[0],
            amount: ''
        });
        setAttachment(null);
        setEditingId(null);
    };

    const handleEdit = (expense) => {
        setFormData({
            expense_head_id: expense.expense_head_id._id,
            name: expense.name,
            description: expense.description || '',
            invoice_number: expense.invoice_number || '',
            date: new Date(expense.date).toISOString().split('T')[0],
            amount: expense.amount
        });
        setEditingId(expense._id);
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch(`${API_URL}/api/expenses/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const data = await res.json();

            if (res.ok) {
                alert('Expense deleted successfully!');
                fetchExpenses();
            } else {
                alert(data.message || 'Failed to delete');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const filteredExpenses = expenses.filter(expense =>
        expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (expense.invoice_number && expense.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Expense Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Add/Edit Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                        <h2 className="text-lg font-bold mb-4">
                            {editingId ? 'Edit Expense' : 'Add Expense'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Expense Head <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.expense_head_id}
                                    onChange={(e) => setFormData({ ...formData, expense_head_id: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                >
                                    <option value="">Select</option>
                                    {expenseHeads.map(head => (
                                        <option key={head._id} value={head._id}>{head.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="e.g., OBSE BOOKS"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    value={formData.invoice_number}
                                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="e.g., 5667"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="150.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Attach Document</label>
                                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                    <input
                                        type="file"
                                        onChange={(e) => setAttachment(e.target.files[0])}
                                        className="hidden"
                                        id="file-upload"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                                        <p className="text-sm text-gray-600">
                                            {attachment ? attachment.name : 'Drag and drop a file here or click'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, or Image (Max 5MB)</p>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    rows="3"
                                    placeholder="Optional description..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Saving...' : editingId ? 'Update' : 'Save'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-bold mb-3">Expense List</h2>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border rounded-lg p-2"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left text-sm font-semibold">Name</th>
                                        <th className="p-3 text-left text-sm font-semibold">Description</th>
                                        <th className="p-3 text-left text-sm font-semibold">Invoice Number</th>
                                        <th className="p-3 text-left text-sm font-semibold">Date</th>
                                        <th className="p-3 text-left text-sm font-semibold">Expense Head</th>
                                        <th className="p-3 text-right text-sm font-semibold">Amount</th>
                                        <th className="p-3 text-center text-sm font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-500">
                                                No expenses found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map((expense) => (
                                            <tr key={expense._id} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium">{expense.name}</td>
                                                <td className="p-3 text-gray-600 text-sm">
                                                    {expense.description ? (
                                                        expense.description.length > 50
                                                            ? expense.description.substring(0, 50) + '...'
                                                            : expense.description
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3 text-sm">{expense.invoice_number || '-'}</td>
                                                <td className="p-3 text-sm">
                                                    {formatDate(expense.date, dateFormat)}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                        {expense.expense_head_id?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-bold">
                                                    {parseFloat(expense.amount).toFixed(2)}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex justify-center gap-2">
                                                        {expense.attachment && (
                                                            <a
                                                                href={`${API_URL}${expense.attachment}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-600 hover:bg-green-50 p-2 rounded"
                                                                title="View Attachment"
                                                            >
                                                                <FileText size={16} />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(expense)}
                                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(expense._id, expense.name)}
                                                            className="text-red-600 hover:bg-red-50 p-2 rounded"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-3 border-t text-sm text-gray-600">
                            Records: {filteredExpenses.length} of {expenses.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
