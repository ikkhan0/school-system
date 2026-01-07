import { useState, useEffect, useContext } from 'react';
import { MessageCircle, Plus, Edit, Trash, Save, X, Info } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const WhatsappTemplates = () => {
    const { user } = useContext(AuthContext);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'general',
        content: '',
        isActive: true
    });

    const templateTypes = [
        { value: 'fee_ledger', label: 'Fee Ledger (Single Student)' },
        { value: 'family_fee', label: 'Family Fee Summary' },
        { value: 'fee_reminder', label: 'Fee Reminder' },
        { value: 'attendance_absent', label: 'Attendance: Absent' },
        { value: 'attendance_late', label: 'Attendance: Late' },
        { value: 'violation', label: 'Discipline / Violation' },
        { value: 'general', label: 'General Announcement' }
    ];

    const availableVariables = {
        fee_ledger: ['{student_name}', '{roll_no}', '{class_section}', '{total_due}', '{history_summary}', '{school_name}', '{father_name}'],
        family_fee: ['{father_name}', '{total_due}', '{children_list}', '{month}', '{school_name}'],
        attendance_absent: ['{student_name}', '{date}', '{school_name}', '{father_name}'],
        attendance_late: ['{student_name}', '{date}', '{time_in}', '{school_name}', '{father_name}'],
        violation: ['{student_name}', '{violation_type}', '{date}', '{remarks}', '{school_name}', '{father_name}'],
        general: ['{student_name}', '{school_name}', '{message_body}', '{father_name}'],
        fee_reminder: ['{student_name}', '{month}', '{total_due}', '{due_date}', '{school_name}', '{father_name}']
    };

    useEffect(() => {
        if (user) fetchTemplates();
    }, [user]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/whatsapp-templates`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('🔍 FRONTEND: handleSubmit called');
        console.log('editingTemplate:', editingTemplate);
        console.log('editingTemplate._id:', editingTemplate?._id);
        console.log('formData:', formData);

        try {
            const url = editingTemplate
                ? `${API_URL}/api/whatsapp-templates/${editingTemplate._id}`
                : `${API_URL}/api/whatsapp-templates`;
            const method = editingTemplate ? 'PUT' : 'POST';

            console.log('🌐 Request URL:', url);
            console.log('📤 Request Method:', method);
            console.log('📦 Request Body:', formData);

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            console.log('📥 Response Status:', res.status);
            console.log('📥 Response OK:', res.ok);

            if (res.ok) {
                const responseData = await res.json();
                console.log('✅ Success Response:', responseData);
                setModalOpen(false);
                setEditingTemplate(null);
                setFormData({ name: '', type: 'general', content: '', isActive: true });
                fetchTemplates();
                alert('Template saved successfully');
            } else {
                const errorData = await res.json();
                console.error('❌ Error Response:', errorData);
                alert(`Failed to save template: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Exception:', error);
            alert('Error saving template: ' + error.message);
        }
    };

    const handleEdit = (tmpl) => {
        console.log('✏️ FRONTEND: handleEdit called');
        console.log('Template to edit:', tmpl);
        console.log('Template ID:', tmpl._id);

        setEditingTemplate(tmpl);
        setFormData({
            name: tmpl.name,
            type: tmpl.type,
            content: tmpl.content,
            isActive: tmpl.isActive
        });
        setModalOpen(true);

        console.log('✅ Edit state set');
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            const res = await fetch(`${API_URL}/api/whatsapp-templates/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) fetchTemplates();
        } catch (error) {
            console.error(error);
        }
    };

    const insertVariable = (variable) => {
        setFormData(prev => ({ ...prev, content: prev.content + ' ' + variable }));
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="text-green-600" /> WhatsApp Templates
                </h1>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setFormData({ name: '', type: 'general', content: '', isActive: true });
                        setModalOpen(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 font-bold shadow-md transform hover:scale-105 transition"
                >
                    <Plus size={20} /> New Template
                </button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tmpl => {
                        const isSystemDefault = !tmpl.tenant_id; // System default if no tenant_id

                        return (
                            <div key={tmpl._id} className={`bg-white p-6 rounded-lg shadow-lg border ${isSystemDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-100'} hover:shadow-xl transition relative group`}>
                                {/* System Default Badge */}
                                {isSystemDefault && (
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                                        System Default
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{tmpl.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${tmpl.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {tmpl.type}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {isSystemDefault ? (
                                            <div className="text-xs text-gray-500 italic">
                                                Read-only
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEdit(tmpl)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Edit template">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(tmpl._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Delete template">
                                                    <Trash size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap h-32 overflow-y-auto border">
                                    {tmpl.content}
                                </div>
                                {isSystemDefault && (
                                    <div className="mt-2 text-xs text-blue-700 italic">
                                        💡 Tip: Create a new template with your own content to override this default
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 transform transition-all">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-2xl font-bold text-gray-800">
                                {editingTemplate ? 'Edit Template' : 'Create Template'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Template Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Monthly Fee Reminder"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Type (Context)</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        {templateTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Message Content</label>
                                <textarea
                                    required
                                    rows="6"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono text-sm"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Enter message here. Click variables below to insert."
                                ></textarea>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Available Variables</p>
                                <div className="flex flex-wrap gap-2">
                                    {(availableVariables[formData.type] || []).map(v => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => insertVariable(v)}
                                            className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono hover:bg-blue-100 border border-blue-200"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Set as Active Default</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Save size={18} /> Save Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsappTemplates;
