

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.route");
const adminRoutes = require("./routes/admin.routes");

//mood route
const moodRoutes=require("./routes/mood.routes")

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Routes
app.use("/auth", authRoutes);
app.use("/dashboard", studentRoutes);
app.use("/dashboard", adminRoutes);
app.use("/api/mood",moodRoutes)
// Health check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Express API!" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
