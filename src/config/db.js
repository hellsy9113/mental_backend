const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.warn('MONGO_URL not set — skipping DB connection (development only)');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('mongoDB connected successfully');
  } catch (error) {
    console.error('mongoDB connection failed', error.message);
    // keep server running for local frontend development
  }
};

module.exports = connectDB;

