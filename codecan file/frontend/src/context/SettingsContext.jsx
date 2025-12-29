import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_URL from '../config';
import AuthContext from './AuthContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [settings, setSettings] = useState({
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12-hour',
        currency: 'PKR',
        loading: true
    });

    useEffect(() => {
        if (user && user.token) {
            fetchSettings();
        } else {
            setSettings(prev => ({ ...prev, loading: false }));
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/school`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const schoolSettings = response.data.settings || {};

            setSettings({
                dateFormat: schoolSettings.date_format || 'DD/MM/YYYY',
                timeFormat: schoolSettings.time_format || '12-hour',
                currency: schoolSettings.currency || 'PKR',
                loading: false
            });
        } catch (error) {
            console.error('Error fetching school settings:', error);
            // Use defaults on error
            setSettings({
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '12-hour',
                currency: 'PKR',
                loading: false
            });
        }
    };

    const refreshSettings = () => {
        if (user && user.token) {
            fetchSettings();
        }
    };

    return (
        <SettingsContext.Provider value={{ ...settings, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;
