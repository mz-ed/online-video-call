import { useEffect, useState } from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';
import useRoomStore             from '../store/roomStore';
import ParticipantGrid          from '../components/ParticipantGrid';
import CallControls             from '../components/CallControls';
import { getLocalStream, stopStream } from '../webrtc/mediaDevices';
import { connectSignaling, joinRoom } from '../webrtc/signalingClient';

const RoomPage = ({ roomId, onLeave }) => {
  const [error, setError] = useState(null);

  const isConnected  = useRoomStore((s) => s.isConnected);
  const isConnecting = useRoomStore((s) => s.isConnecting);
  const peers        = useRoomStore((s) => s.peers);
  const setRoom      = useRoomStore((s) => s.setRoom);
  const setLocalStream = useRoomStore((s) => s.setLocalStream);
  const localStream  = useRoomStore((s) => s.localStream);
  const storeError   = useRoomStore((s) => s.error);

  const peerCount    = Object.keys(peers).length;

  // get userId + username from localStorage (set in LobbyPage)
  const userId   = localStorage.getItem('userId')   ?? 'unknown';
  const username = localStorage.getItem('username') ?? 'Guest';

  useEffect(() => {
    const init = async () => {
      try {
        // 1. get camera + mic
        const stream = await getLocalStream();
        setLocalStream(stream);

        // 2. store room info
        setRoom(roomId, userId, username);

        // 3. connect signaling + join room
        connectSignaling();
        joinRoom(roomId, userId, username);

      } catch (err) {
        setError(err.message);
      }
    };

    init();

    return () => {
      stopStream(localStream);
    };
  }, [roomId]);

  if (error || storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 border border-red-800 rounded-2xl p-8 max-w-sm text-center">
          <p className="text-red-400 mb-4">{error || storeError}</p>
          <button
            onClick={onLeave}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">

      {/* header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">
            {peerCount + 1} participant{peerCount !== 0 ? 's' : ''}
          </span>
        </div>

        <span className="text-xs text-gray-600 font-mono">{roomId}</span>

        <div className="flex items-center gap-1.5">
          {isConnecting && (
            <span className="text-xs text-yellow-400">Connecting...</span>
          )}
          {isConnected ? (
            <Wifi   className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* video grid */}
      <div className="flex-1 overflow-hidden">
        <ParticipantGrid />
      </div>

      {/* controls */}
      <div className="flex justify-center pb-6 pt-2">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
};

export default RoomPage;
