/**
 * src/controller/message.controller.js
 *
 * Thin controller — delegates all business logic to message.services.js.
 * Follows the exact same pattern as counsellor.controller.js and admin.controller.js.
 */

const {
  fetchConversation,
  saveMessage,
  markConversationRead,
  fetchUnreadCount,
} = require('../services/message.services');

/* ── GET /messages/unread-count ─────────────────────────────── */
async function getUnreadCount(req, res) {
  try {
    const count = await fetchUnreadCount(req.user.id, req.user.role);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

/* ── GET /messages/:otherUserId ─────────────────────────────── */
async function getConversation(req, res) {
  try {
    const messages = await fetchConversation(
      req.user.id,
      req.user.role,
      req.params.otherUserId,
      { limit: req.query.limit, before: req.query.before }
    );
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

/* ── POST /messages/:otherUserId ────────────────────────────── */
async function sendMessage(req, res) {
  try {
    const message = await saveMessage(
      req.user.id,
      req.user.role,
      req.user.name,
      req.params.otherUserId,
      req.body.text
    );
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

/* ── PATCH /messages/:otherUserId/read ──────────────────────── */
async function markRead(req, res) {
  try {
    await markConversationRead(req.user.id, req.user.role, req.params.otherUserId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

module.exports = { getUnreadCount, getConversation, sendMessage, markRead };