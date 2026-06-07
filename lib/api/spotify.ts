export async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Spotify auth failed: ' + JSON.stringify(data))
  return data.access_token
}

export async function searchArtist(name: string) {
  const token = await getSpotifyToken()
  const res = await fetch(
    'https://api.spotify.com/v1/search?q=' + encodeURIComponent(name) + '&type=artist&limit=1',
    { headers: { Authorization: 'Bearer ' + token } }
  )
  const data = await res.json()
  const artist = data.artists?.items?.[0]
  if (!artist) return null

  return {
    spotify_id: artist.id,
    name: artist.name,
    followers: artist.followers.total,
    popularity: artist.popularity,
    image: artist.images?.[0]?.url ?? null,
  }
}
