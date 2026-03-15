/**
 * src/socket.js
 *
 * Socket.io signalling server for WebRTC peer connections.
 *
 * Events handled:
 *   join-room      — user joins a call room (roomId = Session._id)
 *   offer          — caller sends SDP offer to peer
 *   answer         — callee sends SDP answer back
 *   ice-candidate  — ICE candidate exchange (both directions)
 *   chat-message   — in-call text message (no WebRTC, just socket relay)
 *   leave-room     — user explicitly leaves the call
 *   disconnect     — socket drops (handles cleanup)
 *
 * The server is a pure relay — it never inspects SDP or ICE payloads.
 * Audio/video flows peer-to-peer (or via TURN) and never touches this server.
 */

const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');

// roomId (Session._id) → Set of socket.id
const rooms = new Map();

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ── JWT auth middleware ──────────────────────────────────────────
  // Runs before every connection. Reuses your existing JWT_SECRET.
  // Token is sent from the frontend via  io({ auth: { token } })
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

    // ── join-room ────────────────────────────────────────────────
    // roomId = the MongoDB Session._id of the scheduled session.
    // Both the student and counsellor join the same roomId.
    // The SECOND person to join triggers peer-joined on the FIRST.
    socket.on('join-room', (roomId) => {
      socket.join(roomId);

      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(socket.id);

      // Notify the other person already in the room
      socket.to(roomId).emit('peer-joined', { userId, role, name });

      console.log(`[Socket] ${role} ${userId} joined room ${roomId} (${rooms.get(roomId).size} members)`);
    });

    // ── WebRTC signalling relay ───────────────────────────────────
    // Server just forwards — never reads or modifies the SDP/ICE data.

    // Caller → Callee: SDP offer
    socket.on('offer', ({ roomId, sdp }) => {
      socket.to(roomId).emit('offer', { sdp });
    });

    // Callee → Caller: SDP answer
    socket.on('answer', ({ roomId, sdp }) => {
      socket.to(roomId).emit('answer', { sdp });
    });

    // Both directions: ICE candidates
    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', { candidate });
    });

    // ── In-call text chat ────────────────────────────────────────
    // No WebRTC needed for text — just socket messages.
    // Sent to everyone in the room INCLUDING the sender so it appears in both UIs.
    socket.on('chat-message', ({ roomId, text }) => {
      io.to(roomId).emit('chat-message', {
        text,
        senderName: name || role,
        senderId:   userId,
        senderRole: role,
        timestamp:  new Date().toISOString(),
      });
    });

    // ── leave-room ───────────────────────────────────────────────
    // Called when the user clicks the "End Call" button.
    socket.on('leave-room', (roomId) => {
      socket.to(roomId).emit('peer-left');
      rooms.get(roomId)?.delete(socket.id);
      socket.leave(roomId);
      console.log(`[Socket] ${role} ${userId} left room ${roomId}`);
    });

    // ── disconnect ───────────────────────────────────────────────
    // Called when the browser tab closes or the connection drops.
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