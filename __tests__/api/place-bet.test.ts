/**
 * @jest-environment node
 */
import { POST } from '@/app/api/bets/place/route'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.Mock

function makeRequest(body: object, token = 'token') {
  return new NextRequest('http://localhost/api/bets/place', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  })
}

function makeClient(options: {
  user?: { id: string } | null
  rapper?: { id: string; activity_score: number } | null
  profile?: { balance: number } | null
  updateError?: { message: string } | null
  betError?: { message: string } | null
}) {
  const updateEq = jest.fn().mockResolvedValue({ error: options.updateError ?? null })
  const insertSingle = jest.fn().mockResolvedValue({
    data: options.betError ? null : { id: 'bet-1', amount: 200, multiplier: 1.7, status: 'active' },
    error: options.betError ?? null,
  })
  const insertSelect = jest.fn().mockReturnValue({ single: insertSingle })
  const insert = jest.fn().mockReturnValue({ select: insertSelect })
  const update = jest.fn().mockReturnValue({ eq: updateEq })

  const from = jest.fn((table: string) => {
    if (table === 'rappers') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: options.rapper ?? null }),
          }),
        }),
      }
    }

    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: options.profile ?? null }),
          }),
        }),
        update,
      }
    }

    if (table === 'bets') {
      return { insert }
    }

    return {}
  })

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: options.user === undefined ? { message: 'Unauthorized' } : null,
      }),
    },
    from,
    updateEq,
    insert,
  }
}

describe('POST /api/bets/place', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('retourne 401 si l utilisateur n est pas connecte', async () => {
    mockCreateClient.mockReturnValue(makeClient({}))

    const res = await POST(makeRequest({
      rapper_id: 'rapper-1',
      amount: 200,
      mode: 'trending',
      bet_type: 'top5',
      project_id: null,
    }))

    expect(res.status).toBe(401)
  })

  it('retourne 400 si le payload est invalide', async () => {
    mockCreateClient.mockReturnValue(makeClient({ user: { id: 'user-1' } }))

    const res = await POST(makeRequest({
      rapper_id: 'rapper-1',
      amount: -10,
      mode: 'trending',
      bet_type: 'top5',
      project_id: null,
    }))

    expect(res.status).toBe(400)
  })

  it('retourne 400 si la balance est insuffisante', async () => {
    mockCreateClient.mockReturnValue(makeClient({
      user: { id: 'user-1' },
      rapper: { id: 'rapper-1', activity_score: 80 },
      profile: { balance: 100 },
    }))

    const res = await POST(makeRequest({
      rapper_id: 'rapper-1',
      amount: 200,
      mode: 'trending',
      bet_type: 'top5',
      project_id: null,
    }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Insufficient balance' })
  })

  it('cree un pari avec une cote recalculee cote serveur', async () => {
    const client = makeClient({
      user: { id: 'user-1' },
      rapper: { id: 'rapper-1', activity_score: 80 },
      profile: { balance: 1000 },
    })
    mockCreateClient.mockReturnValue(client)

    const res = await POST(makeRequest({
      rapper_id: 'rapper-1',
      amount: 200,
      mode: 'trending',
      bet_type: 'top5',
      project_id: null,
    }))

    expect(res.status).toBe(200)
    expect(client.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      rapper_id: 'rapper-1',
      amount: 200,
      multiplier: 1.7,
      status: 'active',
      bet_type: 'top5',
    }))
    expect(client.updateEq).toHaveBeenCalledWith('id', 'user-1')
  })
})
