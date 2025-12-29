# 🔑 ADD THIS TO YOUR .env FILE

## Step 1: Open/Create .env file
Open the file: `d:\Projects Backup\school\backend\.env`

If it doesn't exist, create it.

## Step 2: Add This Line

Add this line to your .env file:

```
IMGBB_API_KEY=ded4053550f59c0b33d70e7e7c675418
```

## Step 3: Complete .env File Should Look Like This:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_key

# Image Upload (ImgBB)
IMGBB_API_KEY=ded4053550f59c0b33d70e7e7c675418

# License (if applicable)
LICENSE_KEY=
```

## Step 4: Save the file

## Step 5: Restart your backend server
```bash
cd backend
npm run dev
```

---

## ✅ For Vercel Production:

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Click "Add New"
3. Enter:
   - **Name**: `IMGBB_API_KEY`
   - **Value**: `ded4053550f59c0b33d70e7e7c675418`
   - **Environments**: Check all (Production, Preview, Development)
4. Click "Save"
5. Redeploy your application

---

## 🧪 Test After Adding:

1. Restart backend server
2. Go to Settings page
3. Upload a school logo
4. It should work! ✨
