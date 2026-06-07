module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !refreshToken) {
    return res.status(500).json({ error: 'Spotify environment variables are not configured.' });
  }

  try {
    // 1. Get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      return res.status(tokenResponse.status).json({ error: `Failed to refresh token: ${errText}` });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch currently playing
    const nowPlayingResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (nowPlayingResponse.status === 200) {
      const nowPlayingData = await nowPlayingResponse.json();
      if (nowPlayingData && nowPlayingData.is_playing && nowPlayingData.item) {
        return res.status(200).json({
          isPlaying: true,
          track: nowPlayingData.item,
          progressMs: nowPlayingData.progress_ms,
        });
      }
    }

    // 3. Fetch recently played if not currently playing
    const recentlyPlayedResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (recentlyPlayedResponse.status === 200) {
      const recentlyPlayedData = await recentlyPlayedResponse.json();
      if (recentlyPlayedData && recentlyPlayedData.items && recentlyPlayedData.items.length > 0) {
        return res.status(200).json({
          isPlaying: false,
          track: recentlyPlayedData.items[0].track,
          progressMs: 0,
        });
      }
    }

    return res.status(200).json({ isPlaying: false, track: null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
