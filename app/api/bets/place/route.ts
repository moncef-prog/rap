import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBetMultiplier, type BetMode, type BetType } from '@/lib/bets'

const MIN_BET_AMOUNT = 10
const MAX_BET_AMOUNT = 100_000

interface PlaceBetBody {
  rapper_id: string
  amount: number
  mode: BetMode
  bet_type: BetType
  project_id: string | null
}

function isBetMode(value: string): value is BetMode {
  return value === 'trending' || value === 'charts' || value === 'project'
}

function parseBody(body: unknown): PlaceBetBody | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const data = body as Record<string, unknown>

  if (typeof data.rapper_id !== 'string' || data.rapper_id.trim().length === 0) return null
  if (typeof data.bet_type !== 'string' || data.bet_type.trim().length === 0) return null
  if (typeof data.mode !== 'string' || !isBetMode(data.mode)) return null
  if (typeof data.amount !== 'number') return null
  if (!Number.isInteger(data.amount) || data.amount < MIN_BET_AMOUNT || data.amount > MAX_BET_AMOUNT) return null

  const projectId = data.project_id
  if (projectId !== null && projectId !== undefined && typeof projectId !== 'string') return null
  if (data.mode === 'project' && (!projectId || typeof projectId !== 'string')) return null

  return {
    rapper_id: data.rapper_id.trim(),
    amount: data.amount,
    mode: data.mode,
    bet_type: data.bet_type as BetType,
    project_id: typeof projectId === 'string' ? projectId : null,
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
    return NextResponse.json({ error: 'Invalid bet payload' }, { status: 400 })
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: rapper } = await supabase
    .from('rappers')
    .select('id, activity_score')
    .eq('id', body.rapper_id)
    .single()

  if (!rapper) {
    return NextResponse.json({ error: 'Rapper not found' }, { status: 404 })
  }

  const multiplier = getBetMultiplier(body.mode, body.bet_type, rapper.activity_score)
  if (!multiplier) {
    return NextResponse.json({ error: 'Invalid bet type for mode' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', authData.user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.balance < body.amount) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  const newBalance = profile.balance - body.amount
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', authData.user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { data: bet, error: betError } = await supabase
    .from('bets')
    .insert({
      user_id: authData.user.id,
      rapper_id: body.rapper_id,
      amount: body.amount,
      multiplier,
      status: 'active',
      project_id: body.project_id,
      bet_type: body.bet_type,
    })
    .select('id, amount, multiplier, status')
    .single()

  if (betError) {
    await supabase.from('profiles').update({ balance: profile.balance }).eq('id', authData.user.id)
    return NextResponse.json({ error: betError.message }, { status: 500 })
  }

  return NextResponse.json({ bet, balance: newBalance })
}
