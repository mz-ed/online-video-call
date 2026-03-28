import { useState } from 'react';
import LobbyPage from './pages/LobbyPage';
import RoomPage  from './pages/RoomPage';

// simple client-side router — no react-router needed
const App = () => {
  const [page, setPage]   = useState('lobby'); // 'lobby' | 'room'
  const [roomId, setRoomId] = useState(null);

  const handleJoinRoom = (id) => {
    setRoomId(id);
    setPage('room');
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setPage('lobby');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {page === 'lobby' && (
        <LobbyPage onJoin={handleJoinRoom} />
      )}
      {page === 'room' && (
        <RoomPage roomId={roomId} onLeave={handleLeaveRoom} />
      )}
    </div>
  );
};

export default App;