const ChatLog = require("../models/aarivChatModel.js");
const { generateAarivResponse } = require("../services/aariv.services.js");

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

const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query; // Assuming userId is passed as query param for now

    const history = await ChatLog.find({ userId, sessionId }).sort({ createdAt: 1 });
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

const getRecentSessions = async (req, res) => {
  try {
    const { userId } = req.query;

    const sessions = await ChatLog.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$sessionId",
          lastMessage: { $first: "$userMessage" },
          updatedAt: { $first: "$createdAt" },
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};

const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    await ChatLog.deleteMany({ userId, sessionId });
    res.json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete chat session" });
  }
};

module.exports = { chatWithAariv, getChatHistory, getRecentSessions, deleteChatSession };