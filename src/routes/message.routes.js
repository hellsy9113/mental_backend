/**
 * routes/message.routes.js
 *
 * Mount in your server.js / app.js:
 *   const messageRouter = require('./routes/message.routes');
 *   app.use('/messages', messageRouter);
 */
const express = require('express');
const { unreadCount, getConversation, sendMessage, markRead } = require('../controller/message.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(verifyToken);

// NOTE: /unread-count must come BEFORE /:otherUserId to avoid param collision
router.get('/unread-count',          unreadCount);
router.get('/:otherUserId',          getConversation);
router.post('/:otherUserId',         sendMessage);
router.patch('/:otherUserId/read',   markRead);

module.exports = router;