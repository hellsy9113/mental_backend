/**
 * src/socket.js  — UPDATED with call notifications
 *
 * New events added on top of existing DM + WebRTC signaling:
 *   call:incoming  → personal room of callee, carries { sessionId, callerId, callerName, callerRole }
 *   call:accepted  → personal room of caller, callee accepted
 *   call:rejected  → personal room of caller, callee rejected/busy
 *   call:ended     → personal room of other participant, call ended
 *   call:missed    → personal room of callee, caller left before answer
 *
 * All existing events (dm:send, join-room, offer, answer, etc.) are unchanged.
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

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

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

    // Personal notification room
    socket.join(`user:${userId}`);

    // ══════════════════════════════════════════════════════════════
    //  CALL SIGNALING (NEW)
    // ══════════════════════════════════════════════════════════════

    /**
     * Counsellor emits call:initiate to notify the student before
     * navigating to /call/:sessionId.
     * { sessionId, calleeUserId }
     */
    socket.on('call:initiate', ({ sessionId, calleeUserId }) => {
      if (!calleeUserId || !sessionId) return;

      console.log(`[Call] ${role} ${userId} → calling ${calleeUserId} for session ${sessionId}`);

      io.to(`user:${calleeUserId}`).emit('call:incoming', {
        sessionId,
        callerId:   userId,
        callerName: name || role,
        callerRole: role,
        timestamp:  new Date().toISOString(),
      });

      // Track the pending call so we can fire call:missed
      socket._pendingCall = { sessionId, calleeUserId };
    });

    /**
     * Callee accepts — navigate to the call room.
     * { sessionId, callerId }
     */
    socket.on('call:accept', ({ sessionId, callerId }) => {
      console.log(`[Call] ${userId} accepted session ${sessionId}`);
      io.to(`user:${callerId}`).emit('call:accepted', {
        sessionId,
        acceptedBy:   userId,
        acceptedName: name || role,
      });
    });

    /**
     * Callee rejects — caller stays on sessions page.
     * { sessionId, callerId }
     */
    socket.on('call:reject', ({ sessionId, callerId }) => {
      console.log(`[Call] ${userId} rejected session ${sessionId}`);
      io.to(`user:${callerId}`).emit('call:rejected', {
        sessionId,
        rejectedBy: userId,
        reason:     'declined',
      });
    });

    /**
     * Either side ends the call early (before peer joined).
     * { sessionId, calleeUserId }
     */
    socket.on('call:cancel', ({ sessionId, calleeUserId }) => {
      console.log(`[Call] ${userId} cancelled ${sessionId}`);
      if (calleeUserId) {
        io.to(`user:${calleeUserId}`).emit('call:missed', {
          sessionId,
          callerName: name || role,
        });
      }
      socket._pendingCall = null;
    });

    /**
     * Notify the other participant that the call has ended.
     * { sessionId, otherUserId }
     */
    socket.on('call:end-notify', ({ sessionId, otherUserId }) => {
      if (otherUserId) {
        io.to(`user:${otherUserId}`).emit('call:ended', {
          sessionId,
          endedBy:   userId,
          endedName: name || role,
        });
      }
    });

    // ══════════════════════════════════════════════════════════════
    //  DIRECT MESSAGES (unchanged)
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

        socket.to(dmRoomKey).emit('dm:message', payload);

        io.to(`user:${toUserId}`).emit('dm:notify', {
          fromUserId:   userId,
          fromName:     senderName,
          counsellorId: payload.counsellorId?.toString(),
          studentId:    payload.studentId?.toString(),
          text:         payload.text,
          createdAt:    payload.createdAt,
        });

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
    //  VIDEO CALL SIGNALLING (unchanged)
    // ══════════════════════════════════════════════════════════════

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(socket.id);
      socket.to(roomId).emit('peer-joined', { userId, role, name });
      console.log(`[Socket] ${role} ${userId} joined room ${roomId}`);
    });

    socket.on('offer',         ({ roomId, sdp })       => socket.to(roomId).emit('offer',         { sdp }));
    socket.on('answer',        ({ roomId, sdp })       => socket.to(roomId).emit('answer',         { sdp }));
    socket.on('ice-candidate', ({ roomId, candidate }) => socket.to(roomId).emit('ice-candidate',  { candidate }));

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
      // Fire call:missed if caller disconnected before answer
      if (socket._pendingCall) {
        const { sessionId, calleeUserId } = socket._pendingCall;
        io.to(`user:${calleeUserId}`).emit('call:missed', {
          sessionId,
          callerName: name || role,
        });
      }

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