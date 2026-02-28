const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const student = require('./routes/user.route');
const admin = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - allow local frontend (Vite)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use('/auth', authRoutes);
app.use('/dashboard', student);
app.use('/dashboard', admin);

// Basic route (health check)
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express API!' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Connect to DB and start server
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;

