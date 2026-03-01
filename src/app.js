

// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");

// const authRoutes = require("./routes/auth.routes");
// const studentRoutes = require("./routes/student.route");
// const adminRoutes = require("./routes/admin.routes");

// //mood route
// const moodRoutes=require("./routes/mood.routes")

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(cors({
//   origin: 'http://localhost:5173',
//   credentials: true
// }));

// // Routes
// app.use("/auth", authRoutes);
// app.use("/dashboard", studentRoutes);
// app.use("/dashboard", adminRoutes);
// app.use("/api/mood",moodRoutes)
// // Health check
// app.get("/", (req, res) => {
//   res.json({ message: "Welcome to Express API!" });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('ERROR:', err);
//   res.status(err.statusCode || 500).json({
//     success: false,
//     error: err.message || 'Internal Server Error'
//   });
// });

// module.exports = app;




require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.route');
const adminRoutes = require('./routes/admin.routes');
const counsellorRoutes = require('./routes/counsellor.routes');
const moodRoutes = require('./routes/mood.routes');

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
app.use('/auth', authRoutes);
app.use('/dashboard', studentRoutes);   // /dashboard/student
app.use('/admin', adminRoutes);         // /admin/stats, /admin/users, etc.
app.use('/counsellor', counsellorRoutes); // /counsellor/profile, /counsellor/students/:id
app.use('/api/mood', moodRoutes);       // /api/mood, /api/mood/stats

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
