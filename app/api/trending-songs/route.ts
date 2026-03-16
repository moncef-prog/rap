import { NextResponse } from 'next/server'

async function getSpotifyToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function GET() {
  try {
    const token = await getSpotifyToken()

    // Top 50 Maroc playlist officielle Spotify
    const res = await fetch(
      'https://api.spotify.com/v1/playlists/37i9dQZEVXbJU9eQpX8gPT/tracks?limit=20&market=MA',
      { headers: { Authorization: 'Bearer ' + token } }
    )
    const data = await res.json()

    const tracks = data.items?.map((item: any) => {
      const track = item.track
      if (!track) return null
      return {
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name,
        album_image: track.album?.images?.[0]?.url,
        popularity: track.popularity,
        preview_url: track.preview_url,
        spotify_url: track.external_urls?.spotify,
      }
    }).filter(Boolean) ?? []

    return NextResponse.json({ tracks })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}