const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcp9y6xas',
    api_key: process.env.CLOUDINARY_API_KEY || '629531215784715',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'KKzS_ZGjje84ejLMxYK7glBCabs'
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder, publicId = null) => {
    return new Promise((resolve, reject) => {
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

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
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
    getPublicIdFromUrl
};
