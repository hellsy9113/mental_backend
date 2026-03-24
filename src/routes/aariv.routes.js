const express = require("express");
const { chatWithAariv, getChatHistory, getRecentSessions, deleteChatSession } = require("../controller/aariv.controller.js");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

// All AARIV routes require a valid token
router.use(verifyToken);

router.post("/chat", chatWithAariv);
router.get("/history/:sessionId", getChatHistory);
router.get("/sessions", getRecentSessions);
router.delete("/session/:sessionId", deleteChatSession);

module.exports = router;