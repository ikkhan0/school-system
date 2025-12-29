import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_URL from '../config';
import AuthContext from '../context/AuthContext';
import SettingsContext from '../context/SettingsContext';
import { formatDate } from '../utils/dateFormatter';
import { SessionContext } from '../context/SessionContext';
import { Calendar, Plus, Lock, Unlock, Archive, Edit2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SessionManagement = () => {
    const { t } = useTranslation(['sessions', 'common']);
    const { user } = useContext(AuthContext);
    const { dateFormat } = useContext(SettingsContext);
    const { refreshSessions } = useContext(SessionContext);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);

    const [formData, setFormData] = useState({
        session_name: '',
        start_date: '',
        end_date: '',
        is_current: false,
        notes: ''
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await axios.get(`${API_URL} /api/sessions`, {
                headers: { Authorization: `Bearer ${user.token} ` }
            });
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            alert(t('sessions:messages.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSession) {
                await axios.put(
                    `${API_URL} /api/sessions / ${editingSession._id} `,
                    formData,
                    { headers: { Authorization: `Bearer ${user.token} ` } }
                );
                alert(t('sessions:messages.updated'));
            } else {
                await axios.post(
                    `${API_URL} /api/sessions`,
                    formData,
                    { headers: { Authorization: `Bearer ${user.token} ` } }
                );
                alert(t('sessions:messages.created'));
            }

            setShowAddForm(false);
            setEditingSession(null);
            setFormData({ session_name: '', start_date: '', end_date: '', is_current: false, notes: '' });
            fetchSessions();
            refreshSessions();
        } catch (error) {
            console.error('Error saving session:', error);
            alert(error.response?.data?.message || t('sessions:messages.failed'));
        }
    };

    const handleEdit = (session) => {
        setEditingSession(session);
        setFormData({
            session_name: session.session_name,
            start_date: session.start_date.split('T')[0],
            end_date: session.end_date.split('T')[0],
            is_current: session.is_current,
            notes: session.notes || ''
        });
        setShowAddForm(true);
    };

    const toggleLock = async (sessionId, currentLockStatus) => {
        try {
            await axios.put(
                `${API_URL} /api/sessions / ${sessionId} `,
                { is_locked: !currentLockStatus },
                { headers: { Authorization: `Bearer ${user.token} ` } }
            );
            fetchSessions();
        } catch (error) {
            alert(t('sessions:messages.lockFailed'));
        }
    };

    const archiveSession = async (sessionId) => {
        if (!confirm(t('sessions:confirm.archive'))) {
            return;
        }

        try {
            await axios.put(
                `${API_URL} /api/sessions / ${sessionId}/archive`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            alert(t('sessions:messages.archived'));
            fetchSessions();
            refreshSessions();
        } catch (error) {
            alert(t('sessions:messages.failed'));
        }
    };

    const setAsCurrent = async (sessionId) => {
        try {
            await axios.put(
                `${API_URL}/api/sessions/${sessionId}`,
                { is_current: true },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            fetchSessions();
            refreshSessions();
        } catch (error) {
            alert(t('sessions:messages.failed'));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('sessions:title')}</h1>
                    <p className="text-gray-600 text-sm mt-1">{t('sessions:description')}</p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setEditingSession(null);
                        setFormData({ session_name: '', start_date: '', end_date: '', is_current: false, notes: '' });
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    {t('sessions:addNew')}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingSession ? t('sessions:edit') : t('sessions:createNew')}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('sessions:sessionName')} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.session_name}
                                    onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                                    placeholder={t('sessions:placeholder.sessionName')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('sessions:startDate')} *
                                </label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('sessions:endDate')} *
                                </label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    required
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_current"
                                    checked={formData.is_current}
                                    onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                                    className="mr-2"
                                />
                                <label htmlFor="is_current" className="text-sm font-medium text-gray-700">
                                    {t('sessions:setCurrent')}
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('sessions:notes')}
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={t('sessions:placeholder.notes')}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                rows="2"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Check size={18} />
                                {editingSession ? t('sessions:buttons.update') : t('sessions:buttons.create')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingSession(null);
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                            >
                                <X size={18} />
                                {t('common:cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Sessions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => (
                    <div
                        key={session._id}
                        className={`bg-white rounded-lg shadow-md p-5 border-2 ${session.is_current ? 'border-blue-500' : 'border-gray-200'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="text-blue-600" size={20} />
                                <h3 className="font-bold text-lg text-gray-800">{session.session_name}</h3>
                            </div>
                            {session.is_current && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                    {t('sessions:current')}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <p>
                                <strong>{t('sessions:startDate')}:</strong> {formatDate(session.start_date, dateFormat)}
                            </p>
                            <p>
                                <strong>{t('sessions:endDate')}:</strong> {formatDate(session.end_date, dateFormat)}
                            </p>
                            {session.notes && (
                                <p className="text-xs italic">{session.notes}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${session.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {session.is_active ? t('sessions:active') : t('sessions:archived')}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${session.is_locked ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {session.is_locked ? t('sessions:locked') : t('sessions:unlocked')}
                            </span>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => handleEdit(session)}
                                className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded"
                            >
                                <Edit2 size={14} />
                                {t('common:edit')}
                            </button>

                            {!session.is_current && session.is_active && (
                                <button
                                    onClick={() => setAsCurrent(session._id)}
                                    className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded"
                                >
                                    <Check size={14} />
                                    {t('sessions:buttons.setCurrent')}
                                </button>
                            )}

                            <button
                                onClick={() => toggleLock(session._id, session.is_locked)}
                                className="flex items-center gap-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded"
                            >
                                {session.is_locked ? <Unlock size={14} /> : <Lock size={14} />}
                                {session.is_locked ? t('sessions:unlock') : t('sessions:lock')}
                            </button>

                            {session.is_active && !session.is_current && (
                                <button
                                    onClick={() => archiveSession(session._id)}
                                    className="flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded"
                                >
                                    <Archive size={14} />
                                    {t('sessions:archive')}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {sessions.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('sessions:empty.title')}</h3>
                    <p className="text-gray-500 mb-4">{t('sessions:empty.description')}</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        {t('sessions:empty.action')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SessionManagement;
