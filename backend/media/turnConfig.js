const config = require('../config/config');

const getTurnCredentials = async () => {
  try {
    const res = await fetch(
      `https://${config.metered.appName}.metered.live/api/v1/turn/credentials?apiKey=${config.metered.apiKey}`
    );

    if (!res.ok) throw new Error(`Metered API responded with ${res.status}`);

    const credentials = await res.json();
    console.log('[TURN] Credentials fetched:', credentials.length, 'servers');
    return credentials;

  } catch (err) {
    console.warn('[TURN] Metered fetch failed, falling back to STUN only:', err.message);

    // fallback — STUN only, no TURN relay
    // works for local dev, may fail for users behind strict NAT
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
  }
};

module.exports = { getTurnCredentials };