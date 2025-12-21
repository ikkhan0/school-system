# Environment Variables for Vercel

Add these to your Vercel project settings:

## Cloudinary Configuration

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for free account
2. Get your credentials from Dashboard
3. Add to Vercel Environment Variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Add to Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Click on "Environment Variables"
4. Add each variable:
   - Name: `CLOUDINARY_CLOUD_NAME`
   - Value: `your_cloud_name`
   - Click "Add"
5. Repeat for API_KEY and API_SECRET
6. Redeploy the project

## Existing Variables:
- MONGO_URI
- JWT_SECRET
- PORT (optional)
