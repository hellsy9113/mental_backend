const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChatLog = require("../models/aarivChatModel.js");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const HIGH_RISK_KEYWORDS = [
  "suicide",
  "self-harm",
  "kill myself",
  "end it all",
  "want to die",
  "don't want to live",
  "marna hai",
];

const SYSTEM_PROMPT = `
You are AARIV, a mental health first aid chatbot.
Be empathetic, supportive and keep answers short.
Never give medical diagnosis.
`;

const generateAarivResponse = async (userId, sessionId, message) => {

  try {

    const lower = message.toLowerCase();

    // -------- Risk detection --------
    if (HIGH_RISK_KEYWORDS.some((k) => lower.includes(k))) {

      return {
        isHighRisk: true,
        response:
          "I'm really sorry you're feeling this way. Please reach out to someone you trust or a professional helpline.",
      };

    }

    // -------- Fetch Memory --------
    const history = await ChatLog.find({ userId, sessionId })
      .sort({ createdAt: -1 })
      .limit(5);

    let memory = "";

    history.reverse().forEach((chat) => {
      memory += `User: ${chat.userMessage}\n`;
      memory += `AARIV: ${chat.botResponse}\n`;
    });

    // -------- Gemini --------
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
${SYSTEM_PROMPT}

Conversation history:
${memory}

User message: "${message}"

Respond empathetically in 2-3 short sentences.
`;

    const result = await model.generateContent(prompt);

    if (!result || !result.response) {
      throw new Error("Invalid Gemini response");
    }

    const response = result.response.text();

    return {
      isHighRisk: false,
      response,
    };

  } catch (error) {

    console.error("Gemini Error:", error.message);

    return {
      isHighRisk: false,
      response: "I'm here with you. Tell me more.",
    };

  }

};

module.exports = { generateAarivResponse };