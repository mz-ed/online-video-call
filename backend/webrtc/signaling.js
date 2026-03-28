const roomManager        = require('../rooms/roomManager');
const { getTurnCredentials } = require('../media/turnConfig');

const registerSignalingHandlers = (io, socket) => {

  // ─── Join room ──────────────────────────────────────────────────────────────
  socket.on('join-room', async ({ roomId, userId, username }) => {
    if (!roomId || !userId) {
      socket.emit('error', { message: 'roomId and userId are required' });
      return;
    }

    try {
      // add peer to in-memory room
      const room = roomManager.addPeer(roomId, socket.id, { userId, username });

      // join the socket.io room
      socket.join(roomId);

      // get TURN credentials to send back to this peer
      const iceServers = await getTurnCredentials();

      // confirm join to the peer that just joined
      socket.emit('joined-room', {
        roomId,
        socketId:   socket.id,
        iceServers,
        peers: roomManager.getPeersInRoom(roomId).filter(p => p.socketId !== socket.id),
      });

      // notify everyone else in the room that a new peer joined
      socket.to(roomId).emit('peer-joined', {
        socketId: socket.id,
        userId,
        username,
      });

      console.log(`[Signaling] ${username} (${socket.id}) joined room ${roomId}`);

    } catch (err) {
      console.error('[Signaling] join-room error:', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // ─── WebRTC offer ───────────────────────────────────────────────────────────
  socket.on('offer', ({ targetSocketId, offer }) => {
    if (!targetSocketId || !offer) return;

    console.log(`[Signaling] offer: ${socket.id} → ${targetSocketId}`);

    io.to(targetSocketId).emit('offer', {
      fromSocketId: socket.id,
      offer,
    });
  });

  // ─── WebRTC answer ──────────────────────────────────────────────────────────
  socket.on('answer', ({ targetSocketId, answer }) => {
    if (!targetSocketId || !answer) return;

    console.log(`[Signaling] answer: ${socket.id} → ${targetSocketId}`);

    io.to(targetSocketId).emit('answer', {
      fromSocketId: socket.id,
      answer,
    });
  });

  // ─── ICE candidate ──────────────────────────────────────────────────────────
  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    if (!targetSocketId || !candidate) return;

    io.to(targetSocketId).emit('ice-candidate', {
      fromSocketId: socket.id,
      candidate,
    });
  });

  // ─── Leave room ─────────────────────────────────────────────────────────────
  socket.on('leave-room', () => {
    handleLeave(io, socket);
  });

  // ─── Toggle mic/camera state broadcast ─────────────────────────────────────
  socket.on('media-state', ({ roomId, isMuted, isCameraOff }) => {
    socket.to(roomId).emit('peer-media-state', {
      socketId:    socket.id,
      isMuted,
      isCameraOff,
    });
  });
};

// ─── Shared leave handler (used by signaling + websocket disconnect) ──────────
const handleLeave = (io, socket) => {
  const roomId = roomManager.getRoomIdBySocket(socket.id);

  if (!roomId) return;

  roomManager.removePeer(socket.id);
  socket.leave(roomId);

  // notify remaining peers
  io.to(roomId).emit('peer-left', {
    socketId: socket.id,
  });

  console.log(`[Signaling] ${socket.id} left room ${roomId}`);
};

module.exports = { registerSignalingHandlers, handleLeave };