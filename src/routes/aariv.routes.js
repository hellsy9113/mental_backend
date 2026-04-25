const express = require("express");
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { chatWithAariv, getChatHistory, getRecentSessions, deleteChatSession } = require("../controller/aariv.controller.js");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

const chatValidation = [
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).withMessage('Message exceeds maximum length of 2000 characters'),
  body('sessionId').optional().isString(),
  validate
];

// All AARIV routes require a valid token
router.use(verifyToken);

router.post("/chat", chatValidation, chatWithAariv);
router.get("/history/:sessionId", getChatHistory);
router.get("/sessions", getRecentSessions);
router.delete("/session/:sessionId", deleteChatSession);

module.exports = router;