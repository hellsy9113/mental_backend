/**
 * src/socket.js  ── FULL REPLACEMENT
 *
 * Adds DM events (dm:send, dm:message, dm:typing) to the existing
 * video-call signalling server. Nothing existing is changed or removed.
 *
 * DM events:
 *   Client → Server:  dm:join   (otherUserId)
 *   Client → Server:  dm:send   { toUserId, text }
 *   Client → Server:  dm:typing { toUserId, isTyping }
 *
 *   Server → Client:  dm:message  { ...savedMessageDoc }
 *   Server → Client:  dm:typing   { fromUserId, fromName, isTyping }
 *   Server → Client:  dm:error    { message }
 *
 * KEY FIX for double-message bug:
 *   dm:message is emitted with  socket.to(roomKey)  (excludes sender)
 *   AND  io.to(`user:${toUserId}`)  (recipient's personal room).
 *   The SENDER never receives the socket echo — they already have the
 *   optimistic bubble. _id deduplication in the frontend is a safety net.
 */

const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');

// roomId (Session._id) → Set<socket.id>  — for video call rooms
const rooms = new Map();

// Lazy-require Message model so this file loads even before DB connects
let Message;
let saveMessage;

function getModels() {
  if (!Message)      Message     = require('./models/Message');
  if (!saveMessage) ({ saveMessage } = require('./services/message.services'));
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ── JWT auth middleware ──────────────────────────────────────────
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

  // ── Connection handler ───────────────────────────────────────────
  io.on('connection', (socket) => {
    const { id: userId, role, name } = socket.user;
    console.log(`[Socket] connected — ${role} ${userId}`);

    // Every user auto-joins their personal notification room
    socket.join(`user:${userId}`);

    // ══════════════════════════════════════════════════════════════
    //  DIRECT MESSAGES  (NEW)
    // ══════════════════════════════════════════════════════════════

    // dm:join — join the shared DM room so both parties receive updates
    socket.on('dm:join', (otherUserId) => {
      getModels();
      const roomKey = Message.roomKey(userId, otherUserId);
      socket.join(roomKey);
      console.log(`[DM] ${role} ${userId} joined ${roomKey}`);
    });

    // dm:send — persist to DB, then relay ONLY to the recipient
    // (sender already has an optimistic bubble — no echo back to sender)
    socket.on('dm:send', async ({ toUserId, text }) => {
      if (!text?.trim() || !toUserId) return;
      getModels();

      try {
        const message = await saveMessage(userId, role, name, toUserId, text);
        const payload = message.toObject();

        // ── Relay to recipient only ──────────────────────────────
        // socket.to(roomKey) → everyone in the room EXCEPT the sender
        const roomKey = Message.roomKey(userId, toUserId);
        socket.to(roomKey).emit('dm:message', payload);

        // Also hit the recipient's personal room in case they're not
        // in the DM room (e.g. they haven't opened the Messages page yet)
        io.to(`user:${toUserId}`).emit('dm:message', payload);

        // ── Send the real saved doc back to the SENDER only ──────
        // This replaces the optimistic bubble with the persisted one
        // (real _id, real createdAt). We tag it so the frontend can
        // match and replace the opt_ bubble instead of appending.
        socket.emit('dm:message:saved', payload);

      } catch (err) {
        console.error('[DM] saveMessage failed:', err.message);
        socket.emit('dm:error', { message: 'Failed to send message. Please try again.' });
      }
    });

    // dm:typing — relay only, not persisted
    socket.on('dm:typing', ({ toUserId, isTyping }) => {
      io.to(`user:${toUserId}`).emit('dm:typing', {
        fromUserId: userId,
        fromName:   name || role,
        isTyping,
      });
    });

    // ══════════════════════════════════════════════════════════════
    //  VIDEO CALL SIGNALLING  (unchanged from original)
    // ══════════════════════════════════════════════════════════════

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(socket.id);
      socket.to(roomId).emit('peer-joined', { userId, role, name });
      console.log(`[Socket] ${role} ${userId} joined room ${roomId} (${rooms.get(roomId).size} members)`);
    });

    socket.on('offer', ({ roomId, sdp }) => {
      socket.to(roomId).emit('offer', { sdp });
    });

    socket.on('answer', ({ roomId, sdp }) => {
      socket.to(roomId).emit('answer', { sdp });
    });

    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', { candidate });
    });

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
      console.log(`[Socket] ${role} ${userId} left room ${roomId}`);
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

module.exports = { initSocket };