import { io }            from 'socket.io-client';
import useRoomStore      from '../store/roomStore';
import { createPeerConnection, closePeerConnection, closeAllPeerConnections } from './peerConnection';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

let socket = null;

// ─── Connect to signaling server ─────────────────────────────────────────────
export const connectSignaling = () => {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    transports:       ['websocket'],
    reconnection:     true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Signaling] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Signaling] Disconnected:', reason);
    useRoomStore.getState().setConnected(false);
  });

  socket.on('connect_error', (err) => {
    console.error('[Signaling] Connection error:', err.message);
    useRoomStore.getState().setError('Could not connect to server');
  });

  // ─── Signaling events ───────────────────────────────────────────────────────

  // server confirms we joined the room
  socket.on('joined-room', async ({ roomId, socketId, iceServers, peers }) => {
    console.log('[Signaling] Joined room:', roomId, '— existing peers:', peers.length);

    const store = useRoomStore.getState();
    store.setIceServers(iceServers);
    store.setConnected(true);

    // create a peer connection for each existing peer in the room
    for (const peer of peers) {
      store.addPeer(peer.socketId, {
        userId:   peer.userId,
        username: peer.username,
      });

      await createPeerConnection(peer.socketId, iceServers, socket, true);
    }
  });

  // a new peer joined — we need to create a connection and wait for their offer
  socket.on('peer-joined', async ({ socketId, userId, username }) => {
    console.log('[Signaling] Peer joined:', socketId, username);

    useRoomStore.getState().addPeer(socketId, { userId, username });
    const { iceServers } = useRoomStore.getState();

    await createPeerConnection(socketId, iceServers, socket, false);
  });

  // received an offer from a peer — send back an answer
  socket.on('offer', async ({ fromSocketId, offer }) => {
    console.log('[Signaling] Offer from:', fromSocketId);
    const { peerConnections, localStream } = getPeerState();
    const pc = peerConnections[fromSocketId];
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer', {
      targetSocketId: fromSocketId,
      answer,
    });
  });

  // received an answer — set it as remote description
  socket.on('answer', async ({ fromSocketId, answer }) => {
    console.log('[Signaling] Answer from:', fromSocketId);
    const { peerConnections } = getPeerState();
    const pc = peerConnections[fromSocketId];
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  });

  // received an ICE candidate — add it to the peer connection
  socket.on('ice-candidate', async ({ fromSocketId, candidate }) => {
    const { peerConnections } = getPeerState();
    const pc = peerConnections[fromSocketId];
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[Signaling] Failed to add ICE candidate:', err.message);
    }
  });

  // a peer left the room
  socket.on('peer-left', ({ socketId }) => {
    console.log('[Signaling] Peer left:', socketId);
    closePeerConnection(socketId);
    useRoomStore.getState().removePeer(socketId);
  });

  // remote peer toggled mic or camera
  socket.on('peer-media-state', ({ socketId, isMuted, isCameraOff }) => {
    useRoomStore.getState().setPeerMediaState(socketId, { isMuted, isCameraOff });
  });

  return socket;
};

// ─── Join a room ──────────────────────────────────────────────────────────────
export const joinRoom = (roomId, userId, username) => {
  if (!socket?.connected) {
    console.error('[Signaling] Not connected');
    return;
  }

  useRoomStore.getState().setConnecting(true);

  socket.emit('join-room', { roomId, userId, username });
  console.log('[Signaling] Joining room:', roomId);
};

// ─── Leave a room ─────────────────────────────────────────────────────────────
export const leaveRoom = () => {
  if (!socket?.connected) return;

  socket.emit('leave-room');
  closeAllPeerConnections();
  useRoomStore.getState().reset();

  console.log('[Signaling] Left room');
};

// ─── Broadcast media state change ─────────────────────────────────────────────
export const broadcastMediaState = (roomId, isMuted, isCameraOff) => {
  if (!socket?.connected) return;
  socket.emit('media-state', { roomId, isMuted, isCameraOff });
};

// ─── Disconnect ───────────────────────────────────────────────────────────────
export const disconnectSignaling = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ─── Internal helper ──────────────────────────────────────────────────────────
const getPeerState = () => {
  return {
    peerConnections,
    localStream: useRoomStore.getState().localStream,
  };
};

// in-memory map of socketId -> RTCPeerConnection
// kept here so signalingClient and peerConnection share the same reference
export const peerConnections = {};