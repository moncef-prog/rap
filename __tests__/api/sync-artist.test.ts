/**
 * @jest-environment node
 */
import { POST } from '@/app/api/sync-artist/route'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}))

// Mock getSpotifyToken
jest.mock('@/lib/api/spotify', () => ({
  getSpotifyToken: jest.fn().mockResolvedValue('mock-spotify-token'),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockCreateClient = createClient as jest.Mock

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/sync-artist', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function makeRawRequest(body: string) {
  return new NextRequest('http://localhost/api/sync-artist', {
    method: 'POST',
    body,
  })
}

describe('POST /api/sync-artist', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('retourne 400 si le body JSON est invalide', async () => {
    const res = await POST(makeRawRequest('{bad-json'))
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  it('retourne 400 si rapper_slug est invalide', async () => {
    const res = await POST(makeRequest({ rapper_slug: '../issam' }))
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toBe('Invalid rapper_slug')
  })

  it('retourne 404 si le rapper n\'existe pas', async () => {
    mockCreateClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: jest.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest({ rapper_slug: 'inconnu' }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Rapper not found')
  })

  it('retourne 400 si le rapper n\'a pas de spotify_id', async () => {
    mockCreateClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: jest.fn().mockResolvedValue({
              data: { name: 'Test', slug: 'test', spotify_id: null },
            }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest({ rapper_slug: 'test' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('spotify_id')
  })

  it('retourne 200 avec les données mises à jour', async () => {
    const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn() })
    mockCreateClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'rappers') {
          return {
            select: () => ({
              eq: () => ({
                single: jest.fn().mockResolvedValue({
                  data: {
                    name: 'Issam',
                    slug: 'issam',
                    spotify_id: 'spotify-123',
                    profile_image_url: null,
                  },
                }),
              }),
            }),
            update: mockUpdate,
          }
        }
        return {}
      },
    })

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        followers: { total: 200_000 },
        popularity: 75,
        images: [{ url: 'https://img.spotify.com/issam.jpg' }],
      }),
    })

    const res = await POST(makeRequest({ rapper_slug: 'issam' }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.rapper).toBe('Issam')
    expect(body.followers).toBe(200_000)
    expect(body.popularity).toBe(75)
    expect(typeof body.activity_score).toBe('number')
    expect(typeof body.odds).toBe('number')
    expect(body.odds).toBeGreaterThanOrEqual(1.1)
  })

  it('retourne 500 en cas d\'erreur inattendue', async () => {
    mockCreateClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: jest.fn().mockRejectedValue(new Error('DB crash')),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest({ rapper_slug: 'test' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB crash')
  })
})
