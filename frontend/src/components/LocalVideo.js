import { useEffect, useRef } from 'react';
import { Mic, MicOff, VideoOff } from 'lucide-react';
import useRoomStore from '../store/roomStore';

const LocalVideo = () => {
  const videoRef    = useRef(null);
  const localStream = useRoomStore((s) => s.localStream);
  const isMuted     = useRoomStore((s) => s.isMuted);
  const isCameraOff = useRoomStore((s) => s.isCameraOff);
  const username    = useRoomStore((s) => s.username);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-900 border border-gray-700">

      {/* video */}
      {isCameraOff ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="flex flex-col items-center gap-2">
            <VideoOff className="w-10 h-10 text-gray-500" />
            <span className="text-gray-400 text-sm">Camera off</span>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}

      {/* name tag */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
          {username ?? 'You'} (you)
        </span>
      </div>

      {/* mute indicator */}
      <div className="absolute top-3 right-3">
        {isMuted ? (
          <div className="bg-red-500/80 rounded-full p-1.5 backdrop-blur-sm">
            <MicOff className="w-3.5 h-3.5 text-white" />
          </div>
        ) : (
          <div className="bg-black/40 rounded-full p-1.5 backdrop-blur-sm">
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalVideo;