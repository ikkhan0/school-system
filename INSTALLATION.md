# iSoft School Management System - Installation Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Database Setup](#database-setup)
4. [License Activation](#license-activation)
5. [First Login](#first-login)
6. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Server Requirements
- **Node.js:** Version 18.x or higher
- **MongoDB:** Version 6.x or higher
- **RAM:** Minimum 1GB (Recommended 2GB+)
- **Storage:** 10GB free space
- **Operating System:** Linux, Windows, or macOS

### Development Requirements
- **NPM:** v9.x or higher
- **Git:** Latest version (optional)

### Browser Support
- Google Chrome (Latest)
- Mozilla Firefox (Latest)
- Microsoft Edge (Latest)
- Safari (Latest)

---

## 📥 Installation Steps

### Step 1: Extract Files

1. Extract the purchased zip file to your desired location:
   ```
   unzip isoft-school-management-v1.0.zip
   cd isoft-school-management
   ```

2. You should see this structure:
   ```
   isoft-school-management/
   ├── backend/
   ├── frontend/
   ├── database/
   ├── documentation/
   ├── LICENSE.txt
   └── README.md
   ```

### Step 2: Install MongoDB

#### Windows:
1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB should start automatically as a service

#### Linux (Ubuntu/Debian):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Verify MongoDB:
```bash
mongosh
# You should see MongoDB shell prompt
```

### Step 3: Install Node.js

#### Windows:
1. Download from: https://nodejs.org/
2. Run the installer (Choose LTS version 18.x)
3. Verify installation:
   ```bash
   node --version  # Should show v18.x.x
   npm --version   # Should show v9.x.x
   ```

#### Linux:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### Step 4: Install Dependencies

#### Backend Setup:
```bash
cd backend
npm install
```

This will install all required packages (~50 dependencies).

#### Frontend Setup:
```bash
cd ../frontend
npm install
```

This will install React and all frontend dependencies.

### Step 5: Environment Configuration

#### Backend Environment Variables:

1. Create `.env` file in `backend/` folder:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` with your settings:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/isoft_school

   # Server
   PORT=5000
   NODE_ENV=production

   # Security
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Image Upload (Cloudinary)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # License System
   LICENSE_KEY=WILL-BE-PROVIDED-BY-SYSTEM
   ```

#### Frontend Environment Variables:

1. Create `.env` file in `frontend/` folder:
   ```bash
   cd ../frontend
   cp .env.example .env
   ```

2. Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

### Step 6: Database Import

1. Import sample database (optional but recommended):
   ```bash
   mongorestore --db isoft_school database/backup/
   ```

2. Or create fresh database:
   ```bash
   mongosh
   use isoft_school
   ```

The database will be created automatically when you run the app.

### Step 7: Start the Application

#### Start Backend:
```bash
cd backend
npm start
```

You should see:
```
✓ Server running on port 5000
✓ MongoDB Connected
✓ Cloudinary Connected
```

#### Start Frontend (New Terminal):
```bash
cd frontend
npm run dev
```

You should see:
```
✓ Vite dev server running
✓ Local: http://localhost:5173
```

### Step 8: Access the Application

1. Open browser and go to: `http://localhost:5173`
2. You should see the login page

---

## 🔑 License Activation

### First-Time Setup

1. **License Wizard Appears:**
   - On first run, you'll see the license activation wizard
   - Enter your purchase code from CodeCanyon

2. **Enter License Key:**
   ```
   Purchase Code: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   School Name: Your School Name
   Email: your-email@example.com
   ```

3. **Activate:**
   - Click "Activate License"
   - System will validate with CodeCanyon
   - License will be saved to database

4. **Success:**
   - You'll see "License Activated Successfully"
   - Proceed to create super admin account

### License Validation

The system validates:
- ✅ Valid CodeCanyon purchase code
- ✅ Code not already used
- ✅ Domain matches (if specified)
- ✅ Not expired

### License Issues?

Contact support: +92-300-6519990 or support@isoft.com.pk

---

## 👤 First Login

### Create Super Admin (First Time)

1. After license activation, create super admin:
   ```
   Email: admin@yourschool.com
   Password: (Choose strong password)
   Name: Your Name
   ```

2. Click "Create Super Admin"

### Demo Credentials (If using sample data)

```
Super Admin:
Email: admin@school.com
Password: admin123

Teacher:
Email: teacher@school.com
Password: teacher123

Accountant:
Email: accountant@school.com
Password: accountant123
```

**⚠️ IMPORTANT:** Change these passwords immediately in production!

---

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

1. **Fork/Clone to GitHub**
2. **Connect to Vercel:**
   - Go to vercel.com
   - Import your repository
   - Configure environment variables
   - Deploy!

3. **Environment Variables in Vercel:**
   - Add all variables from `.env`
   - MONGO_URI, JWT_SECRET, etc.

### Option 2: VPS (Linux Server)

1. **Upload files to server**
2. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

3. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

4. **Start Backend with PM2:**
   ```bash
   cd ../backend
   pm2 start index.js --name isoft-school
   pm2 save
   pm2 startup
   ```

5. **Configure NGINX:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           root /path-to/frontend/dist;
           try_files $uri /index.html;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $request_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 🐛 Troubleshooting

### MongoDB Connection Error

**Problem:** Cannot connect to MongoDB

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection
mongosh
```

### Port Already in Use

**Problem:** Port 5000 or 5173 already in use

**Solution:**
```bash
# Change port in backend/.env
PORT=5001

# Change port in frontend/vite.config.js
server: { port: 5174 }
```

### Node Modules Error

**Problem:** Module not found errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### License Validation Failed

**Problem:** License key not working

**Solution:**
1. Check internet connection
2. Verify purchase code is correct
3. Contact support with purchase code
4. Temporary bypass (development only):
   - Set `SKIP_LICENSE_CHECK=true` in `.env`

### Cloudinary Upload Failed

**Problem:** Images not uploading

**Solution:**
1. Check Cloudinary credentials in `.env`
2. Create free Cloudinary account: cloudinary.com
3. Copy Cloud Name, API Key, API Secret
4. Update `.env` file
5. Restart backend

### Cannot Login

**Problem:** Login not working

**Solution:**
1. Check backend is running (`npm start` in backend folder)
2. Check MongoDB is running
3. Verify `.env` variables
4. Check browser console for errors
5. Clear browser cache

---

## 📞 Support

### Need Help?

**Developer:** Muhammad Imran Hussain Khan  
**Company:** iSoft Pakistan  
**Phone:** +92-300-6519990  
**Email:** support@isoft.com.pk  
**Website:** www.isoft.com.pk | www.isoft.edu.pk

### Support Hours
Monday - Saturday: 9:00 AM - 6:00 PM (PKT)

### What's Included
- ✅ Installation assistance
- ✅ Configuration help
- ✅ Bug fixes
- ✅ Email support (6 months)

### Premium Support (Extra Cost)
- Custom feature development
- White-label solutions
- On-site training
- Dedicated support

---

## 📚 Next Steps

1. ✅ Complete installation
2. ✅ Activate license
3. ✅ Login as super admin
4. 📖 Read User Manual (`USER_GUIDE.md`)
5. ⚙️ Configure school settings
6. 👥 Create user accounts
7. 📝 Add students and classes
8. 🚀 Start using the system!

---

**Congratulations! iSoft School Management System is now installed!** 🎉

For detailed usage instructions, see `USER_GUIDE.md`.
