import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
  // ─── Room state ─────────────────────────────────────────────────────────────
  roomId:   null,
  userId:   null,
  username: null,

  // ─── Connection state ────────────────────────────────────────────────────────
  isConnected:  false,
  isConnecting: false,
  error:        null,

  // ─── Media state ─────────────────────────────────────────────────────────────
  isMuted:      false,
  isCameraOff:  false,
  localStream:  null,
  iceServers:   [],

  // ─── Peers ───────────────────────────────────────────────────────────────────
  // Map of socketId -> { userId, username, stream, isMuted, isCameraOff }
  peers: {},

  // ─── Actions ─────────────────────────────────────────────────────────────────

  setRoom: (roomId, userId, username) => set({ roomId, userId, username }),

  setLocalStream: (stream) => set({ localStream: stream }),

  setIceServers: (iceServers) => set({ iceServers }),

  setConnecting: (isConnecting) => set({ isConnecting }),

  setConnected: (isConnected) => set({ isConnected, isConnecting: false }),

  setError: (error) => set({ error }),

  toggleMic: () => {
    const { localStream, isMuted } = get();
    if (!localStream) return;
    localStream.getAudioTracks().forEach(t => (t.enabled = isMuted));
    set({ isMuted: !isMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (!localStream) return;
    localStream.getVideoTracks().forEach(t => (t.enabled = isCameraOff));
    set({ isCameraOff: !isCameraOff });
  },

  // add a new remote peer
  addPeer: (socketId, info) =>
    set((state) => ({
      peers: {
        ...state.peers,
        [socketId]: { stream: null, isMuted: false, isCameraOff: false, ...info },
      },
    })),

  // attach a remote stream to a peer
  setPeerStream: (socketId, stream) =>
    set((state) => ({
      peers: {
        ...state.peers,
        [socketId]: { ...state.peers[socketId], stream },
      },
    })),

  // update remote peer media state (mute/camera)
  setPeerMediaState: (socketId, { isMuted, isCameraOff }) =>
    set((state) => ({
      peers: {
        ...state.peers,
        [socketId]: { ...state.peers[socketId], isMuted, isCameraOff },
      },