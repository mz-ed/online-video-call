// ─── Get local camera + mic stream ───────────────────────────────────────────
export const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:      { ideal: 1280 },
          height:     { ideal: 720  },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl:  true,
        },
      });
  
      console.log('[MediaDevices] Stream acquired:', 
        stream.getTracks().map(t => `${t.kind}(${t.label})`).join(', ')
      );
  
      return stream;
  
    } catch (err) {
      // give the user a clear message depending on what went wrong
      if (err.name === 'NotAllowedError') {
        throw new Error('Camera and microphone access was denied. Please allow access and try again.');
      }
      if (err.name === 'NotFoundError') {
        throw new Error('No camera or microphone found on this device.');
      }
      if (err.name === 'NotReadableError') {
        throw new Error('Camera or microphone is already in use by another application.');
      }
      throw new Error(`Could not access media devices: ${err.message}`);
    }
  };
  
  // ─── Get screen share stream ──────────────────────────────────────────────────
  export const getScreenStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
  
      console.log('[MediaDevices] Screen stream acquired');
      return stream;
  
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Screen share was denied.');
      }
      throw new Error(`Could not start screen share: ${err.message}`);
    }
  };
  
  // ─── Get available devices ────────────────────────────────────────────────────
  export const getDevices = async () => {
    try {
      const devices  = await navigator.mediaDevices.enumerateDevices();
      return {
        cameras:      devices.filter(d => d.kind === 'videoinput'),
        microphones:  devices.filter(d => d.kind === 'audioinput'),
        speakers:     devices.filter(d => d.kind === 'audiooutput'),
      };
    } catch (err) {
      console.error('[MediaDevices] enumerateDevices failed:', err);
      return { cameras: [], microphones: [], speakers: [] };
    }
  };
  
  // ─── Stop all tracks in a stream ─────────────────────────────────────────────
  export const stopStream = (stream) => {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    console.log('[MediaDevices] Stream stopped');
  };
  
  // ─── Replace video track in all peer connections ──────────────────────────────
  // used when switching camera or starting screen share
  export const replaceVideoTrack = async (newStream, peerConnections) => {
    const newTrack = newStream.getVideoTracks()[0];
    if (!newTrack) return;
  
    for (const pc of Object.values(peerConnections)) {
      const sender = pc
        .getSenders()
        .find(s => s.track && s.track.kind === 'video');
  
      if (sender) await sender.replaceTrack(newTrack);
    }
  
    console.log('[MediaDevices] Video track replaced on', Object.keys(peerConnections).length, 'connections');
  };