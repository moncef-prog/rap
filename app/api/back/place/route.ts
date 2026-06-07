import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { backLevels, getBackBadge, isBackLevel } from '@/lib/backing'

interface PlaceBackBody {
  rapper_id: string
  level: keyof typeof backLevels
}

function parseBody(body: unknown): PlaceBackBody | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const data = body as Record<string, unknown>

  if (typeof data.rapper_id !== 'string' || data.rapper_id.trim().length === 0) return null
  if (typeof data.level !== 'string' || !isBackLevel(data.level)) return null

  return {
    rapper_id: data.rapper_id.trim(),
    level: data.level,
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  )

  let jsonBody: unknown
  try {
    jsonBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const body = parseBody(jsonBody)
  if (!body) {
    return NextResponse.json({ error: 'Invalid back payload' }, { status: 400 })
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: rapper } = await supabase
    .from('rappers')
    .select('id, name, total_backers, total_backed, hype_score')
    .eq('id', body.rapper_id)
    .single()

  if (!rapper) {
    return NextResponse.json({ error: 'Rapper not found' }, { status: 404 })
  }

  const { data: existingBack } = await supabase
    .from('backs')
    .select('id')
    .eq('user_id', authData.user.id)
    .eq('rapper_id', body.rapper_id)
    .maybeSingle()

  if (existingBack) {
    return NextResponse.json({ error: 'Already backed' }, { status: 409 })
  }

  const level = backLevels[body.level]
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', authData.user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.balance < level.amount) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  const totalBackers = Number(rapper.total_backers ?? 0)
  const totalBacked = Number(rapper.total_backed ?? 0)
  const position = totalBackers + 1
  const badge = getBackBadge(level.amount, position)
  const newBalance = profile.balance - level.amount

  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', authData.user.id)

  if (updateProfileError) {
    return NextResponse.json({ error: updateProfileError.message }, { status: 500 })
  }

  const { data: back, error: backError } = await supabase
    .from('backs')
    .insert({
      user_id: authData.user.id,
      rapper_id: body.rapper_id,
      amount: level.amount,
      level: body.level,
      badge,
    })
    .select('id, amount, level, badge')
    .single()

  if (backError) {
    await supabase.from('profiles').update({ balance: profile.balance }).eq('id', authData.user.id)
    return NextResponse.json({ error: backError.message }, { status: 500 })
  }

  await supabase
    .from('rappers')
    .update({
      total_backers: position,
      total_backed: totalBacked + level.amount,
      hype_score: Number(rapper.hype_score ?? 0) + 1,
    })
    .eq('id', body.rapper_id)

  return NextResponse.json({ back, balance: newBalance })
}
