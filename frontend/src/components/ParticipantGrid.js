import useRoomStore from '../store/roomStore';
import LocalVideo   from './LocalVideo';
import RemoteVideo  from './RemoteVideo';

// grid layout based on participant count
const getGridClass = (count) => {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4)  return 'grid-cols-2';
  if (count <= 6)  return 'grid-cols-3';
  return 'grid-cols-4';
};

const ParticipantGrid = () => {
  const peers = useRoomStore((s) => s.peers);
  const peerList  = Object.entries(peers);

  // total tiles = remote peers + 1 local
  const totalCount = peerList.length + 1;
  const gridClass  = getGridClass(totalCount);

  return (
    <div className={`grid ${gridClass} gap-3 w-full h-full p-3`}>

      {/* local video always first */}
      <div className={totalCount === 1 ? 'col-span-1 aspect-video' : 'aspect-video'}>
        <LocalVideo />
      </div>

      {/* remote peers */}
      {peerList.map(([socketId, peer]) => (
        <div key={socketId} className="aspect-video">
          <RemoteVideo
            socketId={socketId}
            username={peer.username}
            stream={peer.stream}
            isMuted={peer.isMuted}
            isCameraOff={peer.isCameraOff}
          />
        </div>
      ))}
    </div>
  );
};

export default ParticipantGrid;