import { useContext } from 'react';
import SettingsContext from '../context/SettingsContext';
import { formatDate, formatTime, formatDateTime } from '../utils/dateFormatter';

/**
 * DateDisplay Component - Displays dates in school's configured format
 * @param {Date|string} date - The date to display
 * @param {string} fallback - Fallback text if date is invalid (default: 'N/A')
 */
export const DateDisplay = ({ date, fallback = 'N/A' }) => {
    const { dateFormat } = useContext(SettingsContext);
    if (!date) return fallback;
    return formatDate(date, dateFormat);
};

/**
 * TimeDisplay Component - Displays time in school's configured format
 * @param {Date|string} time - The time to display
 * @param {string} fallback - Fallback text if time is invalid (default: 'N/A')
 */
export const TimeDisplay = ({ time, fallback = 'N/A' }) => {
    const { timeFormat } = useContext(SettingsContext);
    if (!time) return fallback;
    return formatTime(time, timeFormat);
};

/**
 * DateTimeDisplay Component - Displays date and time in school's configured format
 * @param {Date|string} datetime - The datetime to display
 * @param {string} fallback - Fallback text if datetime is invalid (default: 'N/A')
 */
export const DateTimeDisplay = ({ datetime, fallback = 'N/A' }) => {
    const { dateFormat, timeFormat } = useContext(SettingsContext);
    if (!datetime) return fallback;
    return formatDateTime(datetime, dateFormat, timeFormat);
};

// Export as default for backward compatibility
export default DateDisplay;
