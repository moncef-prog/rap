import { NextResponse } from 'next/server'
import { getSpotifyToken } from '@/lib/api/spotify'

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
  popularity: number
  preview_url: string | null
  external_urls: { spotify: string }
}

export async function GET() {
  try {
    const token = await getSpotifyToken()

    const res = await fetch(
      'https://api.spotify.com/v1/search?q=rap+maroc&type=track&market=MA&limit=10',
      { headers: { Authorization: 'Bearer ' + token } }
    )
    const data = await res.json()

    const tracks = data.tracks?.items?.map((track: SpotifyTrack) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name,
      album_image: track.album?.images?.[0]?.url,
      popularity: track.popularity,
      preview_url: track.preview_url,
      spotify_url: track.external_urls?.spotify,
    })) ?? []

    return NextResponse.json({ tracks })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
