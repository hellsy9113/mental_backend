require('dotenv').config();
const mongoose = require('mongoose');
const { createEntry } = require('./src/services/journal.service');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB Connected successfully.");
    
    // Simulate what the controller does
    const userId = new mongoose.Types.ObjectId();
    const reqBody = {
      title: "Diagnostic Test",
      body: "Testing the Journal Schema and hooks.",
      tags: ["test"]
    };
    
    console.log("Attempting createEntry...");
    const result = await createEntry(userId, reqBody);
    console.log("SUCCESS! Created Journal ID:", result._id);
    
    // Wait briefly for worker triggers
    setTimeout(() => {
        console.log("Worker timeout cleared.");
        process.exit(0);
    }, 1000);
  } catch (err) {
    console.error("DIAGNOSTIC ERROR CAUGHT:");
    console.log("Name:", err.name);
    console.log("Message:", err.message);
    if(err.errors) console.log("Validation Errors:", err.errors);
    process.exit(1);
  }
}

check();
