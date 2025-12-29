const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
// Environment variables are now set in Vercel dashboard
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dcp9y6xas';
const apiKey = process.env.CLOUDINARY_API_KEY || '629531215784715';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'KKzS_ZGjje84ejLMxYK7glBCabs';

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

// Log configuration status (without exposing secrets)
console.log('Cloudinary Configuration:');
console.log('- Cloud Name:', cloudName ? '✓ Set' : '✗ Missing');
console.log('- API Key:', apiKey ? '✓ Set' : '✗ Missing');
console.log('- API Secret:', apiSecret ? '✓ Set' : '✗ Missing');

/**
 * Check if Cloudinary is properly configured
 */
const isCloudinaryConfigured = () => {
    return !!(cloudName && apiKey && apiSecret);
};

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder, publicId = null) => {
    return new Promise((resolve, reject) => {
        // Check if Cloudinary is configured
        if (!isCloudinaryConfigured()) {
            const error = new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
            console.error('❌ Cloudinary configuration error:', error.message);
            reject(error);
            return;
        }

        const uploadOptions = {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { width: 1000, crop: 'limit' }, // Limit max width to 1000px
                { quality: 'auto:good' } // Auto quality optimization
            ]
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        console.log(`📤 Uploading to Cloudinary folder: ${folder}`);

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('✅ Cloudinary upload successful:', result.secure_url);
                    resolve(result);
                }
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
const getPublicIdFromUrl = (url) => {
    if (!url) return null;

    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/filename.jpg
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : null;
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl,
    isCloudinaryConfigured
};
