const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isCloudinaryConfigured, uploadToCloudinary, cloudinary } = require('../config/cloudinary');

// @desc    Test Cloudinary Configuration
// @route   GET /api/test/cloudinary
router.get('/cloudinary', protect, async (req, res) => {
    try {
        // Check if configured
        const configured = isCloudinaryConfigured();

        if (!configured) {
            return res.status(500).json({
                success: false,
                message: 'Cloudinary is not configured',
                env: {
                    cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: !!process.env.CLOUDINARY_API_KEY,
                    api_secret: !!process.env.CLOUDINARY_API_SECRET
                }
            });
        }

        // Test with a small 1x1 red pixel PNG
        const testBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
            'base64'
        );

        console.log('Testing Cloudinary upload...');
        const result = await uploadToCloudinary(testBuffer, 'test-uploads', `test_${Date.now()}`);

        res.json({
            success: true,
            message: 'Cloudinary is working perfectly!',
            url: result.secure_url,
            public_id: result.public_id,
            config: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcp9y6xas',
                configured: true
            }
        });
    } catch (error) {
        console.error('Cloudinary test error:', error);
        res.status(500).json({
            success: false,
            message: 'Cloudinary test failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// @desc    Test API Health
// @route   GET /api/test/health
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        cloudinary_configured: isCloudinaryConfigured()
    });
});

module.exports = router;
