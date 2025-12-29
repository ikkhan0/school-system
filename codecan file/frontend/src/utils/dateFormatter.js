// Date formatting utility based on school settings

/**
 * Format a date according to the school's preferred format
 * @param {Date|string} date - The date to format
 * @param {string} format - The format string (DD/MM/YYYY, MM/DD/YYYY, etc.)
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    const formatMap = {
        'DD/MM/YYYY': `${day}/${month}/${year}`,
        'MM/DD/YYYY': `${month}/${day}/${year}`,
        'YYYY-MM-DD': `${year}-${month}-${day}`,
        'DD-MM-YYYY': `${day}-${month}-${year}`,
        'MM-DD-YYYY': `${month}-${day}-${year}`
    };

    return formatMap[format] || `${day}/${month}/${year}`;
};

/**
 * Format a time according to the school's preferred format
 * @param {Date|string} time - The time to format
 * @param {string} format - The format string ('12-hour' or '24-hour')
 * @returns {string} - Formatted time string
 */
export const formatTime = (time, format = '12-hour') => {
    if (!time) return '';

    const timeObj = typeof time === 'string' ? new Date(time) : time;

    if (isNaN(timeObj.getTime())) return time; // Return as-is if not a valid date

    const hours = timeObj.getHours();
    const minutes = String(timeObj.getMinutes()).padStart(2, '0');

    if (format === '24-hour') {
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    // 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${period}`;
};

/**
 * Format a datetime according to the school's preferred formats
 * @param {Date|string} datetime - The datetime to format
 * @param {string} dateFormat - The date format string
 * @param {string} timeFormat - The time format string
 * @returns {string} - Formatted datetime string
 */
export const formatDateTime = (datetime, dateFormat = 'DD/MM/YYYY', timeFormat = '12-hour') => {
    if (!datetime) return '';

    const date = formatDate(datetime, dateFormat);
    const time = formatTime(datetime, timeFormat);

    return `${date} ${time}`;
};

/**
 * Parse a date string according to the given format and return a Date object
 * @param {string} dateString - The date string to parse
 * @param {string} format - The format of the input string
 * @returns {Date|null} - Parsed date or null if invalid
 */
export const parseDate = (dateString, format = 'DD/MM/YYYY') => {
    if (!dateString) return null;

    let day, month, year;

    const parts = dateString.split(/[\/\-]/);
    if (parts.length !== 3) return null;

    switch (format) {
        case 'DD/MM/YYYY':
        case 'DD-MM-YYYY':
            [day, month, year] = parts;
            break;
        case 'MM/DD/YYYY':
        case 'MM-DD-YYYY':
            [month, day, year] = parts;
            break;
        case 'YYYY-MM-DD':
            [year, month, day] = parts;
            break;
        default:
            [day, month, year] = parts;
    }

    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Get the current date formatted according to school settings
 * @param {string} format - The format string
 * @returns {string} - Formatted current date
 */
export const getCurrentDate = (format = 'DD/MM/YYYY') => {
    return formatDate(new Date(), format);
};

/**
 * Convert a date to input format (YYYY-MM-DD) for HTML date inputs
 * @param {Date|string} date - The date to convert
 * @returns {string} - Date in YYYY-MM-DD format
 */
export const toInputDate = (date) => {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};
