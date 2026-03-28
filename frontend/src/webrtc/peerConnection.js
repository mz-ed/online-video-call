import useRoomStore       from '../store/roomStore';
import { peerConnections } from './signalingClient';

// ─── Create a peer connection with a specific peer ────────────────────────────
// isInitiator = true  → we send the offer  (we were already in the room)
// isInitiator = false → we wait for offer  (we just joined)
export const createPeerConnection = async (
  targetSocketId,
  iceServers,
  socket,
  isInitiator
) => {
  const { localStream } = useRoomStore.getState();

  if (!localStream) {
    console.error('[PeerConnection] No local stream available');
    return null;
  }

  console.log(
    `[PeerConnection] Creating connection with ${targetSocketId} — initiator: ${isInitiator}`
  );

  // ─── Create RTCPeerConnection ───────────────────────────────────────────────
  const pc = new RTCPeerConnection({
    iceServers,
    iceCandidatePoolSize: 10,
  });

  // store it
  peerConnections[targetSocketId] = pc;

  // ─── Add local tracks ───────────────────────────────────────────────────────
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // ─── On remote track received ───────────────────────────────────────────────
  pc.ontrack = (event) => {
    console.log(`[PeerConnection] Remote track received from ${targetSocketId}:`, event.track.kind);

    const [remoteStream] = event.streams;
    useRoomStore.getState().setPeerStream(targetSocketId, remoteStream);
  };

  // ─── On ICE candidate generated ────────────────────────────────────────────
  pc.onicecandidate = (event) => {
    if (!event.candidate) return;

    socket.emit('ice-candidate', {
      targetSocketId,
      candidate: event.candidate,
    });
  };

  // ─── ICE connection state monitor ──────────────────────────────────────────
  pc.oniceconnectionstatechange = () => {
    const state = pc.iceConnectionState;
    console.log(`[PeerConnection] ICE state with ${targetSocketId}: ${state}`);

    if (state === 'failed') {
      console.warn(`[PeerConnection] ICE failed with ${targetSocketId} — restarting`);
      pc.restartIce();
    }

    if (state === 'disconnected') {
      console.warn(`[PeerConnection] Peer ${targetSocketId} disconnected`);
    }
  };

  // ─── Connection state monitor ───────────────────────────────────────────────
  pc.onconnectionstatechange = () => {
    console.log(
      `[PeerConnection] Connection state with ${targetSocketId}: ${pc.connectionState}`
    );
  };

  // ─── If initiator — create and send offer ───────────────────────────────────
  if (isInitiator) {
    try {
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });

      await pc.setLocalDescription(offer);

      socket.emit('offer', {
        targetSocketId,
        offer,
      });

      console.log(`[PeerConnection] Offer sent to ${targetSocketId}`);
    } catch (err) {
      console.error('[PeerConnection] Failed to create offer:', err);
    }
  }

  return pc;
};

// ─── Close a single peer connection ──────────────────────────────────────────
export const closePeerConnection = (socketId) => {
  const pc = peerConnections[socketId];
  if (!pc) return;

  pc.ontrack           = null;
  pc.onicecandidate    = null;
  pc.onconnectionstatechange = null;
  pc.oniceconnectionstatechange = null;

  pc.close();
  delete peerConnections[socketId];

  console.log(`[PeerConnection] Closed connection with ${socketId}`);
};

// ─── Close all peer connections ───────────────────────────────────────────────
export const closeAllPeerConnections = () => {
  Object.keys(peerConnections).forEach(closePeerConnection);
  console.log('[PeerConnection] All connections closed');
};

// ─── Replace local track on all connections ───────────────────────────────────
// used for screen share or camera switch
export const replaceTrack = async (newTrack) => {
  for (const pc of Object.values(peerConnections)) {
    const sender = pc
      .getSenders()
      .find((s) => s.track?.kind === newTrack.kind);

    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  }

  console.log('[PeerConnection] Track replaced on all connections');
};