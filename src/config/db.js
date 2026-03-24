const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.warn('MONGO_URL not set — skipping DB connection');
    return;
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of buffering forever
    });
    console.log('mongoDB connected successfully. readyState:', mongoose.connection.readyState);
  } catch (error) {
    console.error('mongoDB connection failed:', error.message);
    throw error; // Re-throw so server.js catches it and exits
  }
};

module.exports = connectDB;

