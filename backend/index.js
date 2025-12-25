const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*', // Allow all origins (adjust for production if needed)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
    credentials: true
}));
app.use(express.json());

// Connection Guard: Ensure DB is connected before processing requests
app.use(async (req, res, next) => {
    // Skip for health check so we can always debug
    if (req.path === '/api/health') return next();

    const mongoose = require('mongoose');

    // If not connected, try to connect (important for serverless cold starts)
    if (mongoose.connection.readyState !== 1) {
        try {
            console.log('🔄 Database not connected, attempting connection...');
            await connectDB();
            console.log('✅ Database connected successfully');
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            return res.status(503).json({
                success: false,
                message: 'Service Unavailable: Database connection failed.',
                error: 'DB_CONNECTION_FAILED',
                details: error.message
            });
        }
    }

    // Double-check connection state
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Service Unavailable: Database not connected. Please check MONGO_URI in Vercel Settings.',
            error: 'DB_DISCONNECTED'
        });
    }

    next();
});

app.get('/', (req, res) => {
    res.send('I-Soft School Management System API is running (MongoDB)');
});

app.get('/api/health', async (req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };

    // Explicitly check env var presence (masked)
    const hasMongoURI = !!process.env.MONGO_URI;
    const mongoUriPreview = hasMongoURI ? process.env.MONGO_URI.substring(0, 15) + '...' : 'MISSING';

    res.json({
        status: 'ok',
        database: {
            state: dbStatus[mongoose.connection.readyState] || 'unknown',
            host: mongoose.connection.host || 'none',
            envConfigured: hasMongoURI,
            uriPreview: mongoUriPreview
        },
        time: new Date().toISOString()
    });
});

// Routes
app.use('/uploads', express.static('uploads'));

// Import tenant isolation middleware
const ensureTenant = require('./middleware/ensureTenant');
const { protect } = require('./middleware/auth');
const sessionContext = require('./middleware/sessionContext');

// Super Admin Routes (No tenant isolation)
app.use('/api/super-admin', require('./routes/superAdminRoutes'));

// Auth Routes (No tenant isolation - needed for login)
app.use('/api/auth', require('./routes/authRoutes'));

// Protected Routes WITH Tenant Isolation AND Session Context
// All routes below require authentication, tenant context, and session context
app.use('/api/students', protect, ensureTenant, sessionContext, require('./routes/studentRoutes'));
app.use('/api/evaluation', protect, ensureTenant, sessionContext, require('./routes/evaluationRoutes'));
app.use('/api/exams', protect, ensureTenant, sessionContext, require('./routes/examRoutes'));
app.use('/api/fees', protect, ensureTenant, sessionContext, require('./routes/feeRoutes'));
app.use('/api/fee-generation', protect, ensureTenant, sessionContext, require('./routes/feeGenerationRoutes'));
app.use('/api/classes', protect, ensureTenant, require('./routes/classRoutes'));
app.use('/api/subjects', protect, ensureTenant, require('./routes/subjectRoutes'));
app.use('/api/dashboard', protect, ensureTenant, sessionContext, require('./routes/dashboardRoutes'));
app.use('/api/reports', protect, ensureTenant, sessionContext, require('./routes/reportsRoutes'));
app.use('/api/school', protect, ensureTenant, require('./routes/schoolRoutes'));
app.use('/api/staff', protect, ensureTenant, require('./routes/staffRoutes'));
app.use('/api/discounts', protect, ensureTenant, require('./routes/discountRoutes'));
app.use('/api/families', protect, ensureTenant, sessionContext, require('./routes/familyRoutes'));
app.use('/api/users', protect, ensureTenant, require('./routes/userRoutes'));
app.use('/api/expenses', protect, ensureTenant, require('./routes/expenseRoutes'));

// Session Management Routes
app.use('/api/sessions', protect, ensureTenant, sessionContext, require('./routes/sessionRoutes'));
app.use('/api/promotions', protect, ensureTenant, sessionContext, require('./routes/promotionRoutes'));

// Test Routes (for debugging)
app.use('/api/test', require('./routes/testRoutes'));


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;

// Global Error Handling to prevent crashes
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});
