import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            // FORCE RELATIVE PATH: Bypass config.js and env vars entirely
            // This ensures we always hit /api/auth/login on the same domain
            const targetUrl = '/api/auth/login';
            console.log('Attempting login to:', targetUrl);

            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            // Check content type to avoid crashing on HTML error pages (like 404/500 from Vercel)
            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error('Non-JSON response:', text);
                return { success: false, message: `Server Error (${res.status}): Please check console for details.` };
            }

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login Exception:', error);
            return { success: false, message: `Network Error: ${error.message}` };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('impersonating');
        setUser(null);
    };

    // NEW: Method to refresh user from localStorage (for impersonation)
    const refreshUser = () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
