require('dotenv').config();
const mongoose = require('mongoose');
const Journal = require('./src/models/Journal');

async function reset() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to DB");
    const res = await Journal.updateMany({}, { 
      $set: { 
        'embeddingDetails.status': 'pending', 
        'embeddingDetails.retries': 0,
        'embeddingDetails.lastError': null
      } 
    });
    console.log("Reset successful:", res);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

reset();
