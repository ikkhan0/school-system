import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';
import API_URL from '../config';

export const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [currentSession, setCurrentSession] = useState(null);
    const [activeSessions, setActiveSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load active sessions on mount
    useEffect(() => {
        if (user) {
            loadActiveSessions();
        }
    }, [user]);

    const loadActiveSessions = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/sessions/active`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setActiveSessions(response.data);

            // Check localStorage first
            const savedSessionId = localStorage.getItem('selectedSessionId');
            let session = null;

            if (savedSessionId) {
                session = response.data.find(s => s._id === savedSessionId);
            }

            // Fallback to current session
            if (!session) {
                session = response.data.find(s => s.is_current) || response.data[0];
            }

            setCurrentSession(session);

            // Store in localStorage
            if (session) {
                localStorage.setItem('selectedSessionId', session._id);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const switchSession = (sessionId) => {
        const session = activeSessions.find(s => s._id === sessionId);
        if (session) {
            setCurrentSession(session);
            localStorage.setItem('selectedSessionId', sessionId);

            // Reload the page to refresh all data with new session context
            window.location.reload();
        }
    };

    return (
        <SessionContext.Provider value={{
            currentSession,
            activeSessions,
            loading,
            switchSession,
            refreshSessions: loadActiveSessions
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export default SessionContext;
