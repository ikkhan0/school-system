/**
 * ═══════════════════════════════════════════════════════════════════════════
 * iSoft School Management System
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * @author      Muhammad Imran Hussain Khan
 * @company     iSoft Pakistan
 * @website     www.isoft.com.pk | www.isoft.edu.pk
 * @contact     +92-300-6519990
 * @email       support@isoft.com.pk
 * @copyright   Copyright © 2025 iSoft Pakistan. All Rights Reserved.
 *
 * @description Complete School Management System with multi-language support
 * @version     1.0.0
 * @license     Commercial - CodeCanyon Regular License
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTICE: This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 * For customization and support, contact: support@isoft.com.pk
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✓ MongoDB Connected'))
    .catch(err => console.error('✗ MongoDB Error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
// app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/whatsapp-templates', require('./routes/whatsappTemplateRoutes'));
app.use('/api/family', require('./routes/familyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/school', require('./routes/schoolRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'iSoft School Management System API',
        version: '1.0.0'
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✓ iSoft School Management System`);
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ API: http://localhost:${PORT}/api`);
    console.log(`✓ Developer: Muhammad Imran Hussain Khan`);
    console.log(`✓ Contact: +92-300-6519990`);
});

module.exports = app;
