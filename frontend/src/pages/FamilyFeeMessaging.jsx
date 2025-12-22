import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { MessageCircle, Users, Send, Filter, DollarSign, Phone, CheckCircle } from 'lucide-react';
import API_URL from '../config';

const FamilyFeeMessaging = () => {
    const { user } = useContext(AuthContext);
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        class_id: '',
        section_id: '',
        min_balance: 0
    });
    const [selectedFamilies, setSelectedFamilies] = useState([]);
    const [messages, setMessages] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    useEffect(() => {
        if (user) {
            fetchFamilies();
        }
    }, [user]);

    const fetchFamilies = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/families`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFamilies(response.data);
        } catch (error) {
            console.error('Error fetching families:', error);
            alert('Failed to fetch families');
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewMessage = async (family) => {
        try {
            const response = await axios.get(
                `${API_URL}/api/families/${family._id}/consolidated-fees`,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setPreviewData(response.data);
            setShowPreview(true);
        } catch (error) {
            console.error('Error fetching family fees:', error);
            alert('Failed to load family fees');
        }
    };

    const handleSendMessage = async (familyId) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/families/${familyId}/whatsapp-message`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            if (response.data.whatsapp_link) {
                window.open(response.data.whatsapp_link, '_blank');
                alert('WhatsApp message sent successfully!');
                fetchFamilies();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const handleBulkSend = async () => {
        if (selectedFamilies.length === 0) {
            alert('Please select at least one family');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/families/bulk-whatsapp`,
                {
                    class_id: filters.class_id,
                    section_id: filters.section_id,
                    min_balance: filters.min_balance
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            setMessages(response.data.messages);
            alert(`Generated ${response.data.total_families} WhatsApp messages!`);
        } catch (error) {
            console.error('Error generating bulk messages:', error);
            alert('Failed to generate messages');
        } finally {
            setLoading(false);
        }
    };

    const toggleFamilySelection = (familyId) => {
        setSelectedFamilies(prev =>
            prev.includes(familyId)
                ? prev.filter(id => id !== familyId)
                : [...prev, familyId]
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <MessageCircle className="text-green-600" />
                            Family Fee Messaging
                        </h1>
                        <p className="text-gray-600">Send consolidated fee reminders via WhatsApp</p>
                    </div>
                    <button
                        onClick={handleBulkSend}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                        <Send size={20} />
                        Generate Bulk Messages
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter size={20} className="text-gray-600" />
                        <h3 className="font-semibold">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Class</label>
                            <input
                                type="text"
                                value={filters.class_id}
                                onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="e.g., 5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Section</label>
                            <input
                                type="text"
                                value={filters.section_id}
                                onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="e.g., A"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Min Balance</label>
                            <input
                                type="number"
                                value={filters.min_balance}
                                onChange={(e) => setFilters({ ...filters, min_balance: parseFloat(e.target.value) })}
                                className="w-full p-2 border rounded"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Families List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading families...</p>
                        </div>
                    ) : families.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">No families found</p>
                        </div>
                    ) : (
                        families.map(family => (
                            <div key={family._id} className="border-2 rounded-lg p-4 hover:shadow-md transition">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedFamilies.includes(family._id)}
                                            onChange={() => toggleFamilySelection(family._id)}
                                            className="w-5 h-5"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg flex items-center gap-2">
                                                <Users size={20} className="text-blue-600" />
                                                {family.father_name || family.family_head_name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={14} />
                                                    {family.father_mobile}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users size={14} />
                                                    {family.student_count || 0} Children
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePreviewMessage(family)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => handleSendMessage(family._id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            <MessageCircle size={16} />
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bulk Messages Result */}
                {messages.length > 0 && (
                    <div className="mt-6 bg-green-50 p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <CheckCircle className="text-green-600" />
                            Generated Messages ({messages.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div key={index} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{msg.family_name}</p>
                                            <p className="text-sm text-gray-600">{msg.whatsapp_number}</p>
                                            <p className="text-sm text-gray-600">
                                                {msg.student_count} students • Balance: Rs. {msg.total_balance}
                                            </p>
                                        </div>
                                        <a
                                            href={msg.whatsapp_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            Open WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Family Fee Preview</h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded">
                                <h3 className="font-bold mb-2">Family: {previewData.family.father_name}</h3>
                                <p className="text-sm text-gray-600">Phone: {previewData.family.father_mobile}</p>
                            </div>

                            {previewData.students_with_fees.map((item, index) => (
                                <div key={index} className="border p-4 rounded">
                                    <h4 className="font-bold">{item.student.full_name}</h4>
                                    <p className="text-sm text-gray-600">
                                        Class: {item.student.class_id}-{item.student.section_id}
                                    </p>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Tuition Fee:</span>
                                            <span>Rs. {item.fee.tuition_fee || 0}</span>
                                        </div>
                                        {item.fee.other_charges > 0 && (
                                            <div className="flex justify-between">
                                                <span>Other Charges:</span>
                                                <span>Rs. {item.fee.other_charges}</span>
                                            </div>
                                        )}
                                        {item.fee.arrears > 0 && (
                                            <div className="flex justify-between">
                                                <span>Arrears:</span>
                                                <span>Rs. {item.fee.arrears}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold border-t pt-1">
                                            <span>Balance:</span>
                                            <span>Rs. {item.fee.balance || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="bg-blue-50 p-4 rounded">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total Family Balance:</span>
                                    <span>Rs. {previewData.totals.total_balance}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyFeeMessaging;
