const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userId: String,
    sessionId: String,
    userMessage: String,
    botResponse: String,
    isHighRisk: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AarivChat", chatSchema);