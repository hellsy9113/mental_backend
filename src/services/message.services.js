/**
 * src/services/message.services.js
 *
 * Business logic for persistent direct messages between counsellor ↔ student.
 * Controllers stay thin — all DB access and validation lives here.
 *
 * Exports:
 *   resolveParticipants   — derive counsellorId/studentId from caller + other
 *   fetchConversation     — paginated message history
 *   saveMessage           — persist a new message (REST fallback; socket is preferred)
 *   markConversationRead  — mark all incoming messages as read
 *   fetchUnreadCount      — total unread across all conversations for caller
 */

const Message           = require('../models/Message');
const User              = require('../models/User');
const CounsellorProfile = require('../models/CounsellorProfile');

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */

/**
 * Resolves counsellorId and studentId from the two participant IDs.
 * Validates:
 *  - the other user exists
 *  - the roles are counsellor ↔ student (not student ↔ student)
 *  - if caller is counsellor, the student is in their assignedStudents list
 *
 * @param {string} callerId   - req.user.id
 * @param {string} callerRole - req.user.role
 * @param {string} otherUserId
 * @returns {{ counsellorId: string, studentId: string }}
 */
async function resolveParticipants(callerId, callerRole, otherUserId) {
  const other = await User.findById(otherUserId).select('role');
  if (!other) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (callerRole === 'counsellor') {
    if (other.role !== 'student') {
      const err = new Error('You can only message your assigned students');
      err.statusCode = 403;
      throw err;
    }

    // Verify this student is actually assigned to the counsellor
    const profile = await CounsellorProfile.findOne({ userId: callerId });
    const isAssigned = profile?.assignedStudents?.some(
      id => id.toString() === otherUserId.toString()
    );
    if (!isAssigned) {
      const err = new Error('This student is not assigned to you');
      err.statusCode = 403;
      throw err;
    }

    return { counsellorId: callerId, studentId: otherUserId };
  }

  if (callerRole === 'student') {
    if (other.role !== 'counsellor') {
      const err = new Error('You can only message your assigned counsellor');
      err.statusCode = 403;
      throw err;
    }
    return { counsellorId: otherUserId, studentId: callerId };
  }

  const err = new Error('Only counsellors and students can use messaging');
  err.statusCode = 403;
  throw err;
}

/* ──────────────────────────────────────────────────────────────
   FETCH CONVERSATION
   ────────────────────────────────────────────────────────────── */

/**
 * Returns paginated message history between caller and otherUserId.
 * Messages are returned in chronological order (oldest first).
 *
 * @param {string} callerId
 * @param {string} callerRole
 * @param {string} otherUserId
 * @param {{ limit?: number, before?: string }} opts - before is an ISO date cursor
 * @returns {Message[]}
 */
async function fetchConversation(callerId, callerRole, otherUserId, opts = {}) {
  const { counsellorId, studentId } = await resolveParticipants(callerId, callerRole, otherUserId);

  const limit = Math.min(parseInt(opts.limit) || 50, 200);
  const query = { counsellorId, studentId };
  if (opts.before) query.createdAt = { $lt: new Date(opts.before) };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Return in chronological order (oldest first)
  messages.reverse();
  return messages;
}

/* ──────────────────────────────────────────────────────────────
   SAVE MESSAGE  (REST fallback — socket path is preferred)
   ────────────────────────────────────────────────────────────── */

/**
 * Creates and persists a new message.
 * The socket handler (dm:send) also calls Message.create directly for
 * real-time delivery; this REST path is a fallback for non-socket clients.
 *
 * @param {string} callerId
 * @param {string} callerRole
 * @param {string} callerName
 * @param {string} otherUserId
 * @param {string} text
 * @returns {Message}
 */
async function saveMessage(callerId, callerRole, callerName, otherUserId, text) {
  if (!text?.trim()) {
    const err = new Error('Message text is required');
    err.statusCode = 400;
    throw err;
  }

  const { counsellorId, studentId } = await resolveParticipants(callerId, callerRole, otherUserId);

  return Message.create({
    counsellorId,
    studentId,
    senderId:   callerId,
    senderRole: callerRole,
    senderName: callerName || callerRole,
    text:       text.trim(),
  });
}

/* ──────────────────────────────────────────────────────────────
   MARK READ
   ────────────────────────────────────────────────────────────── */

/**
 * Marks all messages in a conversation that were NOT sent by the caller as read.
 *
 * @param {string} callerId
 * @param {string} callerRole
 * @param {string} otherUserId
 */
async function markConversationRead(callerId, callerRole, otherUserId) {
  const { counsellorId, studentId } = await resolveParticipants(callerId, callerRole, otherUserId);

  await Message.updateMany(
    { counsellorId, studentId, senderId: { $ne: callerId }, read: false },
    { read: true }
  );
}

/* ──────────────────────────────────────────────────────────────
   UNREAD COUNT
   ────────────────────────────────────────────────────────────── */

/**
 * Returns total unread message count across ALL conversations for the caller.
 *
 * @param {string} callerId
 * @param {string} callerRole
 * @returns {number}
 */
async function fetchUnreadCount(callerId, callerRole) {
  let query;

  if (callerRole === 'counsellor') {
    query = { counsellorId: callerId, senderId: { $ne: callerId }, read: false };
  } else if (callerRole === 'student') {
    query = { studentId: callerId, senderId: { $ne: callerId }, read: false };
  } else {
    return 0;
  }

  return Message.countDocuments(query);
}

/* ──────────────────────────────────────────────────────────────
   EXPORTS
   ────────────────────────────────────────────────────────────── */

module.exports = {
  resolveParticipants,
  fetchConversation,
  saveMessage,
  markConversationRead,
  fetchUnreadCount,
};