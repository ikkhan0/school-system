# 🚨 URGENT: Fix Vercel 500 Error

## The Problem
Your Vercel deployment is failing with a 500 error because **environment variables are missing**.

## The Solution (5 Minutes)

### Step 1: Open Your Local `.env` File

1. Open `d:\Projects Backup\school\backend\.env` in VS Code
2. Copy the values for these variables:
   - `MONGO_URI`
   - `JWT_SECRET`

### Step 2: Add Variables to Vercel

1. **Go to:** https://vercel.com/dashboard
2. **Select your project:** `soft-school-management`
3. **Click:** Settings (top menu)
4. **Click:** Environment Variables (left sidebar)
5. **Add these 4 variables:**

   Click "Add New" for each:

   ```
   Name: MONGO_URI
   Value: [paste your MongoDB connection string from .env]
   Environment: Production ✓
   ```

   ```
   Name: JWT_SECRET
   Value: [paste your JWT secret from .env]
   Environment: Production ✓
   ```

   ```
   Name: PORT
   Value: 5000
   Environment: Production ✓
   ```

   ```
   Name: NODE_ENV
   Value: production
   Environment: Production ✓
   ```

6. **Click "Save"** after each variable

### Step 3: Redeploy

After adding all 4 variables:

1. Go to **Deployments** tab
2. Click the **three dots (...)** on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes for deployment to complete

### Step 4: Test

Once deployment completes:

1. Visit: https://soft-school-management.vercel.app
2. Click "Super Admin Login"
3. Login with:
   - Email: `admin@school.com`
   - Password: `admin123`

✅ If login works, you're done!

---

## Why This Happens

- Your `.env` file is **NOT uploaded** to Vercel (it's in `.gitignore`)
- Vercel needs these variables to connect to MongoDB and generate JWT tokens
- **This is a ONE-TIME setup** - once added, they persist forever

---

## Need Help?

If you still see errors after adding variables:

1. Check Vercel logs:
   - Deployments → Click latest → Functions tab
2. Verify MongoDB Atlas allows connections from `0.0.0.0/0`
3. Make sure all 4 variables are set for "Production" environment

---

## After This Works

Once Super Admin login works, you can:
- Create schools
- Add users with different roles
- Test the permission system
- Share the URL with your team

**No more configuration needed!** 🎉
