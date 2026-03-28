import { useState } from 'react';
import { Video, LogIn, Plus }  from 'lucide-react';
import { createRoom, getRoom } from '../api/roomApi';
import { syncUser }            from '../api/roomApi';

const LobbyPage = ({ onJoin }) => {
  const [username, setUsername]   = useState('');
  const [roomName, setRoomName]   = useState('');
  const [joinCode, setJoinCode]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState('create'); // 'create' | 'join'

  // generate a simple guest user id for now
  // replace this with your real auth service user id
  const getOrCreateUserId = () => {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('userId', id);
    }
    return id;
  };

  const handleCreate = async () => {
    if (!username.trim()) return setError('Enter your name');
    if (!roomName.trim()) return setError('Enter a room name');

    setLoading(true);
    setError(null);

    try {
      const userId = getOrCreateUserId();

      // sync user with backend
      await syncUser(userId, username, `${username}@guest.local`);

      // create room
      const room = await createRoom(roomName, userId);

      onJoin(room.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!username.trim()) return setError('Enter your name');
    if (!joinCode.trim()) return setError('Enter a room code');

    setLoading(true);
    setError(null);

    try {
      const userId = getOrCreateUserId();

      // verify room exists
      await getRoom(joinCode.trim());

      // sync user with backend
      await syncUser(userId, username, `${username}@guest.local`);

      onJoin(joinCode.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <Video className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">VideoCall</h1>
        </div>

        {/* card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

          {/* username */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-1.5">Your name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* tabs */}
          <div className="flex gap-2 mb-5 bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create room
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tab === 'join'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Join room
            </button>
          </div>

          {/* create tab */}
          {tab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Room name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Team standup"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create room'}
              </button>
            </div>
          )}

          {/* join tab */}
          {tab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Room code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Paste room ID here"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Joining...' : 'Join room'}
              </button>
            </div>
          )}

          {/* error */}
          {error && (
            <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;