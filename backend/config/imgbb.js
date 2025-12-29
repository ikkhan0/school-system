const axios = require('axios');
const FormData = require('form-data');

// ImgBB API Configuration
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// Log configuration status (without exposing secrets)
console.log('ImgBB Configuration:');
console.log('- API Key:', IMGBB_API_KEY ? '✓ Set' : '✗ Missing');

/**
 * Check if ImgBB is properly configured
 */
const isImgBBConfigured = () => {
    return !!IMGBB_API_KEY;
};

/**
 * Upload image buffer to ImgBB
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} name - Image name/identifier
 * @returns {Promise<Object>} ImgBB upload result with URL
 */
const uploadToImgBB = async (buffer, name = 'upload') => {
    try {
        // Check if ImgBB is configured
        if (!isImgBBConfigured()) {
            const error = new Error('ImgBB is not configured. Please set IMGBB_API_KEY environment variable.');
            console.error('❌ ImgBB configuration error:', error.message);
            throw error;
        }

        console.log(`📤 Uploading to ImgBB: ${name}`);

        // Convert buffer to base64
        const base64Image = buffer.toString('base64');

        // Create form data
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64Image);
        formData.append('name', name);

        // Upload to ImgBB
        const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.success && response.data.data) {
            const imageUrl = response.data.data.url;
            const deleteUrl = response.data.data.delete_url;

            console.log('✅ ImgBB upload successful:', imageUrl);

            return {
                success: true,
                url: imageUrl,
                display_url: response.data.data.display_url,
                delete_url: deleteUrl,
                size: response.data.data.size,
                thumb: response.data.data.thumb
            };
        } else {
            throw new Error('Invalid response from ImgBB');
        }
    } catch (error) {
        console.error('❌ ImgBB upload error:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        throw error;
    }
};

/**
 * Delete image from ImgBB (if delete URL is available)
 * Note: ImgBB requires delete URL for deletion, not a public ID
 * @param {string} deleteUrl - Delete URL provided during upload
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromImgBB = async (deleteUrl) => {
    try {
        if (!deleteUrl) {
            console.log('⚠️ No delete URL provided, skipping deletion');
            return { success: false, message: 'No delete URL' };
        }

        console.log('🗑️ Deleting from ImgBB...');
        // ImgBB requires visiting the delete URL to delete the image
        // This is a limitation of the free tier
        await axios.get(deleteUrl);
        console.log('✅ Image deleted from ImgBB');

        return { success: true };
    } catch (error) {
        console.error('❌ ImgBB delete error:', error.message);
        // Don't throw error on delete failure - it's not critical
        return { success: false, error: error.message };
    }
};

module.exports = {
    uploadToImgBB,
    deleteFromImgBB,
    isImgBBConfigured
};
