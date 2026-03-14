import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getSpotifyToken() {
  const credentials = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
  ).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Spotify auth failed: ' + JSON.stringify(data))
  return data.access_token
}

function calculateScore(popularity: number, followers: number): number {
  const score = (popularity * 0.6) + (Math.min(followers / 10000, 40))
  return Math.min(Math.round(score), 99)
}

function calculateOdds(score: number): number {
  const odds = parseFloat((2.5 - (score / 100) * 1.5).toFixed(1))
  return Math.max(odds, 1.1)
}

export async function POST(req: NextRequest) {
  try {
    const { rapper_slug } = await req.json()

    const { data: rapper } = await supabase
      .from('rappers')
      .select('*')
      .eq('slug', rapper_slug)
      .single()

    if (!rapper) return NextResponse.json({ error: 'Rapper not found' }, { status: 404 })
    if (!rapper.spotify_id) return NextResponse.json({ error: 'No spotify_id for ' + rapper.name }, { status: 400 })

    const token = await getSpotifyToken()

    const spotifyRes = await fetch(
      'https://api.spotify.com/v1/artists/' + rapper.spotify_id,
      { headers: { Authorization: 'Bearer ' + token } }
    )
    const spotify = await spotifyRes.json()

    const image = spotify.images?.[0]?.url ?? rapper.profile_image_url
    const followers = spotify.followers?.total ?? 0
    const popularity = spotify.popularity ?? 0
    const activity_score = calculateScore(popularity, followers)
    const odds = calculateOdds(activity_score)

    await supabase.from('rappers').update({
      activity_score,
      spotify_followers: followers,
      spotify_popularity: popularity,
      profile_image_url: image,
    }).eq('slug', rapper_slug)

    return NextResponse.json({
      rapper: rapper.name,
      followers,
      popularity,
      activity_score,
      odds,
      image,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}