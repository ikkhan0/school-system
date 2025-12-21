const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('I-Soft School Management System API is running (MongoDB)');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/evaluation', require('./routes/evaluationRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

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
