const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── helper ───────────────────────────────────────────────────────────────────
const request = async (method, path, body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ─── Rooms ────────────────────────────────────────────────────────────────────

// create a new room
export const createRoom = (name, hostId) =>
  request('POST', '/api/rooms', { name, hostId });

// get room info
export const getRoom = (roomId) =>
  request('GET', `/api/rooms/${roomId}`);

// get all rooms by host
export const getRoomsByHost = (hostId) =>
  request('GET', `/api/rooms?hostId=${hostId}`);

// close a room
export const closeRoom = (roomId, hostId) =>
  request('DELETE', `/api/rooms/${roomId}`, { hostId });

// ─── TURN ─────────────────────────────────────────────────────────────────────

// fetch ICE servers — called before joining a room
export const getTurnCredentials = () =>
  request('GET', '/api/turn');

// ─── Users ────────────────────────────────────────────────────────────────────

// get user profile
export const getUser = (userId) =>
  request('GET', `/api/users/${userId}`);

// sync user with backend (call after auth service signup/login)
export const syncUser = (id, username, email) =>
  request('POST', '/api/users', { id, username, email });