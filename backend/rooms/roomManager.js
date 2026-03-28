// In-memory store of live room state
// DB is source of truth for room existence
// roomManager tracks who is currently connected

const rooms = new Map();

// room structure:
// {
//   id: string,
//   peers: Map<socketId, { userId, username }>
// }

const getOrCreateRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id:    roomId,
      peers: new Map(),
    });
  }
  return rooms.get(roomId);
};

const addPeer = (roomId, socketId, peerInfo) => {
  const room = getOrCreateRoom(roomId);
  room.peers.set(socketId, peerInfo);
  console.log(`[RoomManager] Peer ${socketId} joined room ${roomId} — ${room.peers.size} peers total`);
  return room;
};

const removePeer = (socketId) => {
  let removedFrom = null;

  for (const [roomId, room] of rooms.entries()) {
    if (room.peers.has(socketId)) {
      room.peers.delete(socketId);
      removedFrom = roomId;
      console.log(`[RoomManager] Peer ${socketId} left room ${roomId} — ${room.peers.size} peers remaining`);

      // clean up empty rooms from memory
      if (room.peers.size === 0) {
        rooms.delete(roomId);
        console.log(`[RoomManager] Room ${roomId} empty, removed from memory`);
      }
      break;
    }
  }

  return removedFrom;
};

const getPeersInRoom = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.peers.entries()).map(([socketId, info]) => ({
    socketId,
    ...info,
  }));
};

const getRoomIdBySocket = (socketId) => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.peers.has(socketId)) return roomId;
  }
  return null;
};

const getRoomSize = (roomId) => {
  const room = rooms.get(roomId);
  return room ? room.peers.size : 0;
};

module.exports = {
  addPeer,
  removePeer,
  getPeersInRoom,
  getRoomIdBySocket,
  getRoomSize,
};