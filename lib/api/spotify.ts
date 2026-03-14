const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!

async function getAccessToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function searchArtist(name: string) {
  const token = await getAccessToken()
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