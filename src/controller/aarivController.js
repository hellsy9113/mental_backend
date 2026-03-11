const ChatLog = require("../models/aarivChatModel.js");
const { generateAarivResponse } = require("../services/aarivservice.js");

const chatWithAariv = async (req, res) => {
  try {
    const { userId, sessionId, message } = req.body;

    const result = await generateAarivResponse(userId, sessionId, message);

    await ChatLog.create({
      userId,
      sessionId,
      userMessage: message,
      botResponse: result.response,
      isHighRisk: result.isHighRisk,
    });

    res.json(result);
  } catch (error) {
    console.error(error);

    res.json({
      isHighRisk: false,
      response: "I'm here with you. Tell me more.",
    });
  }
};

module.exports = { chatWithAariv };