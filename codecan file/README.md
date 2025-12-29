# iSoft School Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Commercial-green.svg)
![Languages](https://img.shields.io/badge/languages-8-orange.svg)

**A comprehensive, professional school management solution with multi-language support and WhatsApp integration.**

---

## 👨‍💻 Author Information

**Developer:** Muhammad Imran Hussain Khan  
**Company:** iSoft Pakistan  
**Contact:** +92-300-6519990  
**Email:** support@isoft.com.pk  
**Website:** [www.isoft.com.pk](http://www.isoft.com.pk) | [www.isoft.edu.pk](http://www.isoft.edu.pk)

**Copyright © 2025 iSoft Pakistan. All Rights Reserved.**

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your settings

# 3. Start application
cd backend && npm start        # Terminal 1
cd frontend && npm run dev     # Terminal 2

# 4. Open browser
http://localhost:5173
```

**📖 Full installation guide:** See [INSTALLATION.md](./INSTALLATION.md)

---

## ✨ Key Features

- 🌍 **8 Languages** - English, Urdu, Arabic, Hindi, Bengali, Spanish, French, Turkish
- 👥 **Student Management** -Complete registration, profiles, promotion
- 💰 **Fee Collection** - Advanced billing, family accounts, auto-discounts
- 📊 **Attendance System** - Quick marking, reports, alerts
- 📝 **Exam Management** - Results, grade calculations, sharing
- 💬 **WhatsApp Integration** - Automated notifications and reminders
- 📈 **Reports & Analytics** - 20+ built-in reports with PDF/Excel export
- 🔐 **Multi-User** - Role-based permissions
- 🎨 **Modern UI** - Responsive, Dark mode ready

---

## 🛠️ Technology Stack

**Frontend:** React 18, Vite, Tailwind CSS, i18next  
**Backend:** Node.js, Express, MongoDB  
**Storage:** Cloudinary (Images)  
**Auth:** JWT, bcrypt

---

## 📂 Project Structure

```
isoft-school-management/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── i18n/          # Internationalization
│   │   └── utils/         # Utility functions
│   └── public/
│       └── locales/       # Translation files (8 languages)
│
├── backend/            # Node.js backend API
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── utils/             # Helper functions
│
├── database/           # Database backups & samples
├── documentation/      # User guides & API docs
└── README.md          # This file
```

---

## 🔑 License System

This product requires a valid license key to operate.  
**Purchase from:** [CodeCanyon](https://codecanyon.net/)

On first run, you'll be prompted to:
1. Enter your CodeCanyon purchase code
2. Activate license
3. Create super admin account

---

## 📞 Support & Customization

### Included Support (6 Months)
- Installation assistance
- Configuration help
- Bug fixes
- Email support

### Premium Services
- ✨ Custom feature development
- 🎨 White-label solutions
- 🏫 On-site training
- 📱 Mobile app development
- 🌐 Multi-school/franchise setup

**Contact:** +92-300-6519990 or support@isoft.com.pk

---

## 📚 Documentation

- **Installation Guide:** [INSTALLATION.md](./INSTALLATION.md)
- **User Manual:** [documentation/USER_GUIDE.md](./documentation/USER_GUIDE.md)
- **API Documentation:** [documentation/API.md](./documentation/API.md)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)

---

## 🌍 Multi-Language Support

Fully translated in 8 languages with RTL support for Arabic and Urdu:

| Language | Code | Status | RTL |
|----------|------|--------|-----|
| English  | en   | ✅ Complete | ❌ |
| Urdu     | ur   | ✅ Complete | ✅ |
| Arabic   | ar   | ✅ Complete | ✅ |
| Hindi    | hi   | 🟡 Ready | ❌ |
| Bengali  | bn   | 🟡 Ready | ❌ |
| Spanish  | es   | 🟡 Ready | ❌ |
| French   | fr   | 🟡 Ready | ❌ |
| Turkish  | tr   | 🟡 Ready | ❌ |

Easy to add more languages! See [i18n documentation](./documentation/I18N.md).

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Automatic deployment via GitHub
vercel --prod
```

### VPS/Dedicated Server
```bash
# Build frontend
cd frontend && npm run build

# Start backend with PM2
cd backend
pm2 start index.js --name isoft-school
```

See [INSTALLATION.md](./INSTALLATION.md) for detailed deployment guides.

---

## ⚙️ Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/isoft_school
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

---

## 🔒 Security

- 🔐 JWT-based authentication
- 🔑 Bcrypt password hashing
- 🛡️ Role-based access control
- 🔒 Environment variable protection
- ✅ Input validation & sanitization
- 🚫 SQL injection prevention (NoSQL)
- 🔒 XSS protection

---

## 📊 Demo Credentials

**Super Admin:**
```
Email: admin@school.com
Password: admin123
```

**⚠️ CRITICAL:** Change these in production!

---

## 🎁 What You Get

✅ Complete source code (Frontend + Backend)  
✅ 8-language translation files  
✅ Installation & user guides  
✅ Sample database  
✅ Demo credentials  
✅ 6 months free support  
✅ Lifetime updates  
✅ Commercial license  

---

## 🐛 Known Issues & Roadmap

### v1.1 (Planned)
- [ ] Student/Parent portal
- [ ] Mobile app (React Native)
- [ ] Online payments integration
- [ ] Email notifications
- [ ] Automated backups

### v1.0 (Current)
- [x] Complete school management
- [x] 8 languages support
- [x] WhatsApp integration
- [x] Multi-user system

---

## 📝 Changelog

### Version 1.0.0 (January 2025)
- Initial release
- Complete school management features
- 8 languages with RTL support
- WhatsApp integration
- Comprehensive reporting

See [CHANGELOG.md](./CHANGELOG.md) for full history.

---

## 💡 Tips & Best Practices

1. **Always backup** before updating
2. **Use strong passwords** for all accounts
3. **Enable HTTPS** in production
4. **Regular database backups** (automated recommended)
5. **Keep Node.js & MongoDB updated**
6. **Monitor logs** for errors
7. **Test on staging** before production changes

---

## ❓ FAQ

**Q: Can I customize the system?**  
A: Yes! Full source code included. Modify as needed.

**Q: Do I get updates?**  
A: Yes! Lifetime updates included with purchase.

**Q: How many schools can I manage?**  
A: Currently single-school. Multi-school available as custom development.

**Q: Can I white-label this?**  
A: Yes, with Extended License or custom agreement.

**Q: Is mobile app included?**  
A: Mobile-responsive web app included. Native mobile app available separately.

---

## 🤝 Contributing

This is a commercial product. For customizations or contributions, contact:  
**support@isoft.com.pk** or **+92-300-6519990**

---

## 📜 License

**CodeCanyon Regular License**

This is a commercial product. You may use this software in one end product that does not charge end users. See LICENSE.txt for full terms.

For extended commercial use, purchase Extended License from CodeCanyon.

---

## 🙏 Acknowledgments

- Built with ❤️ by iSoft Pakistan
- UI inspired by modern SaaS applications
- Icons from Lucide React
- Charts powered by Recharts

---

## 📧 Contact

**Have questions? Need help?**

📧 **Email:** support@isoft.com.pk  
📱 **Phone/WhatsApp:** +92-300-6519990  
🌐 **Website:** www.isoft.com.pk | www.isoft.edu.pk  
💬 **Support Hours:** Mon-Sat, 9 AM - 6 PM (PKT)

---

**Made with ❤️ in Pakistan by iSoft**

*Transforming Education through Technology*

---

**© 2025 iSoft Pakistan. All Rights Reserved.**

**Unauthorized copying, distribution, or modification is strictly prohibited.**
