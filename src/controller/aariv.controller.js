const ChatLog = require("../models/aarivChatModel.js");
const { generateAarivResponse } = require("../services/aariv.services.js");

const MAX_MESSAGE_LENGTH = 2000; // cap to prevent unbounded Gemini API cost

const chatWithAariv = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from verified JWT — not from req.body (IDOR fix)
    const { sessionId, message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message is required." });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` });
    }
    if (!sessionId) {
      return res.status(400).json({ success: false, error: "sessionId is required." });
    }

    const result = await generateAarivResponse(userId, sessionId, message.trim());

    await ChatLog.create({
      userId,
      sessionId,
      userMessage: message.trim(),
      botResponse: result.response,
      isHighRisk: result.isHighRisk,
    });

    res.json(result);
  } catch (error) {
    console.error("[Aariv] chatWithAariv error:", error);
    res.json({
      isHighRisk: false,
      response: "I'm here with you. Tell me more.",
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ IDOR fix
    const { sessionId } = req.params;

    const history = await ChatLog.find({ userId, sessionId }).sort({ createdAt: 1 });
    res.json(history);
  } catch (error) {
    console.error("[Aariv] getChatHistory error:", error);
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
};

const getRecentSessions = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ IDOR fix

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
    console.error("[Aariv] getRecentSessions error:", error);
    res.status(500).json({ error: "Failed to fetch sessions." });
  }
};

const deleteChatSession = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ IDOR fix
    const { sessionId } = req.params;

    await ChatLog.deleteMany({ userId, sessionId });
    res.json({ message: "Chat session deleted successfully." });
  } catch (error) {
    console.error("[Aariv] deleteChatSession error:", error);
    res.status(500).json({ error: "Failed to delete chat session." });
  }
};

module.exports = { chatWithAariv, getChatHistory, getRecentSessions, deleteChatSession };