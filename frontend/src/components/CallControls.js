import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import useRoomStore            from '../store/roomStore';
import { leaveRoom, broadcastMediaState } from '../webrtc/signalingClient';
import { stopStream }          from '../webrtc/mediaDevices';

const CallControls = ({ onLeave }) => {
  const [copied, setCopied] = useState(false);

  const isMuted     = useRoomStore((s) => s.isMuted);
  const isCameraOff = useRoomStore((s) => s.isCameraOff);
  const roomId      = useRoomStore((s) => s.roomId);
  const localStream = useRoomStore((s) => s.localStream);
  const toggleMic    = useRoomStore((s) => s.toggleMic);
  const toggleCamera = useRoomStore((s) => s.toggleCamera);

  const handleToggleMic = () => {
    toggleMic();
    broadcastMediaState(roomId, !isMuted, isCameraOff);
  };

  const handleToggleCamera = () => {
    toggleCamera();
    broadcastMediaState(roomId, isMuted, !isCameraOff);
  };

  const handleLeave = () => {
    stopStream(localStream);
    leaveRoom();
    if (onLeave) onLeave();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center gap-4 py-4 px-6 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700">

      {/* mic toggle */}
      <button
        onClick={handleToggleMic}
        className={`p-3 rounded-full transition-all duration-200 ${
          isMuted
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted
          ? <MicOff  className="w-5 h-5 text-white" />
          : <Mic     className="w-5 h-5 text-white" />
        }
      </button>

      {/* camera toggle */}
      <button
        onClick={handleToggleCamera}
        className={`p-3 rounded-full transition-all duration-200 ${
          isCameraOff
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
      >
        {isCameraOff
          ? <VideoOff className="w-5 h-5 text-white" />
          : <Video    className="w-5 h-5 text-white" />
        }
      </button>

      {/* copy link */}
      <button
        onClick={handleCopyLink}
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-200"
        title="Copy room link"
      >
        {copied
          ? <Check className="w-5 h-5 text-green-400" />
          : <Copy  className="w-5 h-5 text-white"     />
        }
      </button>

      {/* leave call */}
      <button
        onClick={handleLeave}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-200 ml-2"
        title="Leave call"
      >
        <PhoneOff className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

export default CallControls;