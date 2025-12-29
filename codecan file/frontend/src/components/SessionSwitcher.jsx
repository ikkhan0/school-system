import { useContext } from 'react';
import { SessionContext } from '../context/SessionContext';
import { Calendar, ChevronDown } from 'lucide-react';

const SessionSwitcher = () => {
    const { currentSession, activeSessions, switchSession, loading } = useContext(SessionContext);

    if (loading || !currentSession || activeSessions.length === 0) {
        return null;
    }

    // Don't show if only one session
    if (activeSessions.length === 1) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                    {currentSession.session_name}
                </span>
            </div>
        );
    }

    return (
        <div className="relative">
            <label className="block text-xs text-gray-600 mb-1 font-medium">
                Academic Year
            </label>
            <div className="relative">
                <div className="flex items-center gap-2 bg-white border-2 border-blue-200 rounded-lg px-3 py-2 hover:border-blue-400 transition-colors">
                    <Calendar size={16} className="text-blue-600" />
                    <select
                        value={currentSession._id}
                        onChange={(e) => switchSession(e.target.value)}
                        className="bg-transparent border-none outline-none font-semibold text-sm text-gray-800 pr-6 cursor-pointer appearance-none w-full"
                    >
                        {activeSessions.map(session => (
                            <option key={session._id} value={session._id}>
                                {session.session_name}
                                {session.is_current && ' (Current)'}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default SessionSwitcher;
