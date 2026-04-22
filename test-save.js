require('dotenv').config();
const mongoose = require('mongoose');
const Journal = require('./src/models/Journal');

async function testUpdate() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB for update test");

    // Grab the first journal document
    const doc = await Journal.findOne().sort({ createdAt: -1 });
    if (!doc) {
      console.log("No doc found");
      process.exit(0);
    }
    
    // Simulate updating body
    doc.body = doc.body + " updated";
    
    // Attempt save
    await doc.save();
    
    console.log("Update save successful!");
    process.exit(0);
    
  } catch (err) {
    console.error("FATAL UPDATE ERROR:");
    console.error(err.message);
    if(err.stack) console.error(err.stack);
    process.exit(1);
  }
}

testUpdate();
