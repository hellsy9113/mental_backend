require('dotenv').config();
const mongoose = require('mongoose');
const Journal = require('./src/models/Journal');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to DB");
    
    const entry = await Journal.findOne().sort({ createdAt: -1 });
    if (!entry) {
      console.log("No entries found");
    } else {
      console.log("Latest Entry Details:");
      console.log("- Title:", entry.title);
      console.log("- Status:", entry.embeddingDetails.status);
      console.log("- Retries:", entry.embeddingDetails.retries);
      console.log("- Last Error:", entry.embeddingDetails.lastError);
      console.log("- Vector length:", entry.embeddingDetails.vector ? entry.embeddingDetails.vector.length : 0);
      console.log("- Metadata:", JSON.stringify(entry.embeddingDetails.metadata, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
