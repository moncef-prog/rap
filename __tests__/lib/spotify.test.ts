import { getSpotifyToken, searchArtist } from '@/lib/api/spotify'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockClear()
  process.env.SPOTIFY_CLIENT_ID = 'test-client-id'
  process.env.SPOTIFY_CLIENT_SECRET = 'test-client-secret'
})

describe('getSpotifyToken', () => {
  it('retourne le token si la réponse est correcte', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ access_token: 'mock-token-abc' }),
    })

    const token = await getSpotifyToken()
    expect(token).toBe('mock-token-abc')
  })

  it('appelle le bon endpoint Spotify', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ access_token: 'tok' }),
    })

    await getSpotifyToken()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://accounts.spotify.com/api/token',
      expect.objectContaining({
        method: 'POST',
        body: 'grant_type=client_credentials',
      })
    )
  })

  it('envoie le header Authorization en Basic base64', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ access_token: 'tok' }),
    })

    await getSpotifyToken()

    const call = mockFetch.mock.calls[0][1]
    const expected = 'Basic ' + Buffer.from('test-client-id:test-client-secret').toString('base64')
    expect(call.headers.Authorization).toBe(expected)
  })

  it('lève une erreur si access_token absent', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ error: 'invalid_client' }),
    })

    await expect(getSpotifyToken()).rejects.toThrow('Spotify auth failed')
  })
})

describe('searchArtist', () => {
  it('retourne les données de l\'artiste formatées', async () => {
    // Premier appel : getSpotifyToken
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ access_token: 'tok' }),
    })
    // Deuxième appel : search
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        artists: {
          items: [{
            id: 'artist-123',
            name: 'Mafia du Mali',
            followers: { total: 50_000 },
            popularity: 72,
            images: [{ url: 'https://example.com/img.jpg' }],
          }],
        },
      }),
    })

    const result = await searchArtist('Mafia du Mali')

    expect(result).toEqual({
      spotify_id: 'artist-123',
      name: 'Mafia du Mali',
      followers: 50_000,
      popularity: 72,
      image: 'https://example.com/img.jpg',
    })
  })

  it('retourne null si aucun artiste trouvé', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ access_token: 'tok' }),
    })
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ artists: { items: [] } }),
    })

    const result = await searchArtist('artiste-inexistant')
    expect(result).toBeNull()
  })

  it('retourne null si image absente', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ access_token: 'tok' }) })
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        artists: {
          items: [{
            id: 'x', name: 'Test', followers: { total: 0 }, popularity: 10, images: [],
          }],
        },
      }),
    })

    const result = await searchArtist('Test')
    expect(result?.image).toBeNull()
  })
})
