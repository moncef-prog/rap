import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSpotifyToken } from '@/lib/api/spotify'
import { calculateScore, calculateOdds } from '@/lib/utils/scoring'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function parseSyncArtistBody(body: unknown): { rapper_slug: string } | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null

  const rapperSlug = (body as Record<string, unknown>).rapper_slug
  if (typeof rapperSlug !== 'string') return null

  const normalizedSlug = rapperSlug.trim().toLowerCase()
  if (!SLUG_PATTERN.test(normalizedSlug)) return null

  return { rapper_slug: normalizedSlug }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  try {
    let jsonBody: unknown
    try {
      jsonBody = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const body = parseSyncArtistBody(jsonBody)
    if (!body) {
      return NextResponse.json({ error: 'Invalid rapper_slug' }, { status: 400 })
    }

    const { rapper_slug } = body

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
