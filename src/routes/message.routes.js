/**
 * src/routes/message.routes.js
 */
const express = require('express');
const {
  getUnreadCount,   // ← was `unreadCount` — mismatch with controller export caused the crash
  getConversation,
  sendMessage,
  markRead,
} = require('../controller/message.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(verifyToken);

// /unread-count MUST come before /:otherUserId to avoid Express treating
// the string "unread-count" as an otherUserId param value
router.get('/unread-count',        getUnreadCount);
router.get('/:otherUserId',        getConversation);
router.post('/:otherUserId',       sendMessage);
router.patch('/:otherUserId/read', markRead);

module.exports = router;