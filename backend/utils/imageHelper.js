/**
 * Image Helper Utilities
 * Handles Base64 conversion for private image storage
 */

/**
 * Convert image buffer to Base64 data URI
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} mimetype - MIME type (e.g., 'image/jpeg')
 * @returns {string} Base64 data URI
 */
const bufferToBase64DataURI = (buffer, mimetype) => {
    if (!buffer || !mimetype) {
        throw new Error('Buffer and mimetype are required');
    }

    const base64String = buffer.toString('base64');
    return `data:${mimetype};base64,${base64String}`;
};

/**
 * Validate image size
 * @param {Buffer} buffer - Image buffer
 * @param {number} maxSizeInMB - Maximum size in MB (default: 5)
 * @returns {boolean} True if valid
 */
const validateImageSize = (buffer, maxSizeInMB = 5) => {
    const sizeInMB = buffer.length / (1024 * 1024);
    if (sizeInMB > maxSizeInMB) {
        throw new Error(`Image size (${sizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeInMB}MB)`);
    }
    return true;
};

/**
 * Check if string is a valid Base64 data URI
 * @param {string} str - String to check
 * @returns {boolean}
 */
const isBase64DataURI = (str) => {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('data:image/');
};

module.exports = {
    bufferToBase64DataURI,
    validateImageSize,
    isBase64DataURI
};
