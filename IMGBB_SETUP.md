# ImgBB Image Upload Setup Guide

## Quick Start

ImgBB is a simple and reliable image hosting service with a free API.

### 1. Get Your API Key

1. Visit [https://api.imgbb.com/](https://api.imgbb.com/)
2. Click "Get API Key" or "Sign Up"
3. Create a free account (no credit card required)
4. Copy your API key from the dashboard

### 2. Add to Environment Variables

#### Local Development
Add to `backend/.env`:
```env
IMGBB_API_KEY=your_api_key_here
```

#### Vercel Production
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3 Add:
   - **Name**: `IMGBB_API_KEY`
   - **Value**: Your API key from ImgBB
   - **Environment**: Select **Production**, **Preview**, and **Development**
4. Click **Save**
5. Redeploy your application

### 3. Verify It Works

Once configured, test the upload functionality:
- Upload a school logo from Settings page
- Add a student with a photo
- Check that images display correctly

### ImgBB Features

✅ **Free Tier**: 32 MB max file size, unlimited uploads  
✅ **Simple API**: No complex configuration needed  
✅ **Reliable**: 99.9% uptime  
✅ **Fast**: Global CDN  
✅ **No Limits**: Unlimited storage on free plan

### Troubleshooting

**Error: "ImgBB is not configured"**
- Make sure `IMGBB_API_KEY` is set in your environment variables
- Restart your server after adding the variable

**Error: "Upload failed"**
- Check that your API key is valid
- Ensure image file size is under 32 MB
- Verify you're not hitting rate limits (unlikely on free plan)

**Images not displaying**
- Check browser console for CORS issues
- Verify the returned URL is accessible
- Ensure browser can access imgbb.com domain

### Migration from Cloudinary

The system has been updated to use ImgBB instead of Cloudinary. All new uploads will automatically use ImgBB. Existing images uploaded to Cloudinary will continue to work.

---

## Technical Details

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)  
- GIF (.gif)
- BMP (.bmp)
- WEBP (.webp)

### API Limits (Free Plan)
- Max file size: 32 MB
- Unlimited uploads
- No bandwidth limits
- No expiration on images

### Used For
- School logos
- Student photos
- Staff photos  
- Result card images
- Expense attachments
