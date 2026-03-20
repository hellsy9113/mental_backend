/**
 * src/socket.js  ── UPDATED
 *
 * Changes from original:
 * 1. Added notifyStudentSessionCreated() — called by counsellor.services.js
 *    when a new session is created. Emits 'session:new' to the student's
 *    personal socket room so they get an instant notification.
 * 2. All DM and video call logic preserved exactly.
 */

const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');

const rooms = new Map(); // sessionId → Set<socket.id>

let Message;
let saveMessage;

function getModels() {
  if (!Message)     Message     = require('./models/Message');
  if (!saveMessage) ({ saveMessage } = require('./services/message.services'));
}

// Module-level io reference so services can emit events
let _io = null;

/**
 * Called by counsellor.services.createSession() after persisting a new session.
 * Sends a real-time notification to the student's personal socket room.
 *
 * @param {string} studentId  - MongoDB ObjectId string
 * @param {Object} sessionData - plain session object to send
 */
function notifyStudentSessionCreated(studentId, sessionData) {
  if (!_io) return; // socket not yet initialised (e.g. test env)
  _io.to(`user:${studentId}`).emit('session:new', sessionData);
}

/**
 * Called by counsellor.services.updateSession() when status changes.
 * Notifies both parties.
 *
 * @param {string} studentId
 * @param {string} counsellorId
 * @param {Object} sessionData
 */
function notifySessionUpdated(studentId, counsellorId, sessionData) {
  if (!_io) return;
  _io.to(`user:${studentId}`).emit('session:updated', sessionData);
  _io.to(`user:${counsellorId}`).emit('session:updated', sessionData);
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  _io = io; // store reference for notifyStudentSessionCreated

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role, name } = socket.user;
    console.log(`[Socket] connected — ${role} ${userId}`);

    // Personal notification room — for badge/notify/session events
    socket.join(`user:${userId}`);

    // ══════════════════════════════════════════════════════════════
    //  DIRECT MESSAGES
    // ══════════════════════════════════════════════════════════════

    socket.on('dm:join', (otherUserId) => {
      getModels();
      const roomKey = Message.roomKey(userId, otherUserId);
      socket.join(roomKey);
      console.log(`[DM] ${role} ${userId} joined ${roomKey}`);
    });

    socket.on('dm:send', async ({ toUserId, text }) => {
      if (!text?.trim() || !toUserId) return;
      getModels();

      try {
        const senderName = name || role;
        const message    = await saveMessage(userId, role, senderName, toUserId, text);
        const payload    = message.toObject();
        const dmRoomKey  = Message.roomKey(userId, toUserId);

        // 1. Deliver to recipient if they have the chat open (DM room, excludes sender)
        socket.to(dmRoomKey).emit('dm:message', payload);

        // 2. Notify recipient's personal room for unread badge
        io.to(`user:${toUserId}`).emit('dm:notify', {
          fromUserId:   userId,
          fromName:     senderName,
          counsellorId: payload.counsellorId?.toString(),
          studentId:    payload.studentId?.toString(),
          text:         payload.text,
          createdAt:    payload.createdAt,
        });

        // 3. Confirm to sender with the real persisted doc
        socket.emit('dm:message:saved', payload);

      } catch (err) {
        console.error('[DM] saveMessage failed:', err.message);
        socket.emit('dm:error', { message: 'Failed to send message. Please try again.' });
      }
    });

    socket.on('dm:typing', ({ toUserId, isTyping }) => {
      io.to(`user:${toUserId}`).emit('dm:typing', {
        fromUserId: userId,
        fromName:   name || role,
        isTyping,
      });
    });

    // ══════════════════════════════════════════════════════════════
    //  VIDEO CALL SIGNALLING
    // ══════════════════════════════════════════════════════════════

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(socket.id);
      socket.to(roomId).emit('peer-joined', { userId, role, name });
      console.log(`[Socket] ${role} ${userId} joined room ${roomId}`);
    });

    socket.on('offer',         ({ roomId, sdp })       => socket.to(roomId).emit('offer', { sdp }));
    socket.on('answer',        ({ roomId, sdp })       => socket.to(roomId).emit('answer', { sdp }));
    socket.on('ice-candidate', ({ roomId, candidate }) => socket.to(roomId).emit('ice-candidate', { candidate }));

    socket.on('chat-message', ({ roomId, text }) => {
      io.to(roomId).emit('chat-message', {
        text,
        senderName: name || role,
        senderId:   userId,
        senderRole: role,
        timestamp:  new Date().toISOString(),
      });
    });

    socket.on('leave-room', (roomId) => {
      socket.to(roomId).emit('peer-left');
      rooms.get(roomId)?.delete(socket.id);
      socket.leave(roomId);
      console.log(`[Socket] ${role} ${userId} left ${roomId}`);
    });

    socket.on('disconnect', () => {
      rooms.forEach((members, roomId) => {
        if (members.has(socket.id)) {
          socket.to(roomId).emit('peer-left');
          members.delete(socket.id);
          if (members.size === 0) rooms.delete(roomId);
        }
      });
      console.log(`[Socket] disconnected — ${role} ${userId}`);
    });
  });

  return io;
}

module.exports = { initSocket, notifyStudentSessionCreated, notifySessionUpdated };