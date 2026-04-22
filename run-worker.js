require('dotenv').config();
const mongoose = require('mongoose');
const { processPendingEmbeddings } = require('./src/services/ragWorker.service');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to DB");
    
    // Process the queue once
    await processPendingEmbeddings();
    
    console.log("Process complete.");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
