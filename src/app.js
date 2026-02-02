require ('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes=require("./routes/auth.routes")
const student=require("./routes/user.route")
const admin=require("./routes/admin.routes")
const connectDB=require('./config/db');
const cors = require('cors');

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

//cors setup
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use("/auth",authRoutes)
app.use("/dashboard", student)
app.use("/dashboard",admin)

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express API!' });
});


//handling error globle
app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});

//connected to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;