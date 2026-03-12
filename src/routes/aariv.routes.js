const express = require("express");
const { chatWithAariv, getChatHistory, getRecentSessions, deleteChatSession } = require("../controller/aariv.controller.js");

const router = express.Router();

router.post("/chat", chatWithAariv);
router.get("/history/:sessionId", getChatHistory);
router.get("/sessions", getRecentSessions);
router.delete("/session/:sessionId", deleteChatSession);

module.exports = router;