require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes     = require('./routes/auth.routes');
const studentRoutes  = require('./routes/student.route');
const adminRoutes    = require('./routes/admin.routes');
const counsellorRoutes = require('./routes/counsellor.routes');
const moodRoutes     = require('./routes/mood.routes');
const profileRoutes  = require('./routes/profile.routes');
const journalRoutes  = require('./routes/journal.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — use env variable so this works in dev, staging, and production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Routes
app.use('/auth',       authRoutes);
app.use('/dashboard',  studentRoutes);
app.use('/admin',      adminRoutes);
app.use('/counsellor', counsellorRoutes);
app.use('/api/mood',   moodRoutes);
app.use('/profile',    profileRoutes);
app.use('/api/journal', journalRoutes);   // NEW

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Vyannaid API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;