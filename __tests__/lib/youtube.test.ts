import { getChannelStats, searchYoutubeChannel } from '@/lib/api/youtube'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockClear()
  process.env.YOUTUBE_API_KEY = 'test-yt-key'
})

const mockChannel = {
  statistics: {
    subscriberCount: '125000',
    viewCount: '8500000',
    videoCount: '47',
  },
  snippet: {
    title: 'Anas Oumou Official',
    thumbnails: { high: { url: 'https://yt.example.com/thumb.jpg' } },
  },
}

describe('getChannelStats', () => {
  it('retourne les statistiques formatées', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ items: [mockChannel] }),
    })

    const result = await getChannelStats('UCxxx')

    expect(result).toEqual({
      subscribers: 125_000,
      total_views: 8_500_000,
      video_count: 47,
      name: 'Anas Oumou Official',
      image: 'https://yt.example.com/thumb.jpg',
    })
  })

  it('retourne null si channel introuvable', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ items: [] }),
    })

    const result = await getChannelStats('UCinconnu')
    expect(result).toBeNull()
  })

  it('gère subscriberCount manquant (défaut à 0)', async () => {
    const channelSansSubs = {
      statistics: { viewCount: '1000', videoCount: '5' },
      snippet: { title: 'Test', thumbnails: { high: { url: '' } } },
    }
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ items: [channelSansSubs] }),
    })

    const result = await getChannelStats('UCtest')
    expect(result?.subscribers).toBe(0)
  })

  it('appelle l\'API YouTube avec le bon channelId', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ items: [mockChannel] }),
    })

    await getChannelStats('UCabc123')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('UCabc123')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('test-yt-key')
    )
  })
})

describe('searchYoutubeChannel', () => {
  it('recherche puis récupère les stats du channel', async () => {
    // Premier appel : search
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        items: [{ id: { channelId: 'UCfound' } }],
      }),
    })
    // Deuxième appel : getChannelStats
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ items: [mockChannel] }),
    })

    const result = await searchYoutubeChannel('Anas Oumou')
    expect(result?.name).toBe('Anas Oumou Official')
  })

  it('retourne null si aucun channel trouvé', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ items: [] }),
    })

    const result = await searchYoutubeChannel('artiste-inconnu')
    expect(result).toBeNull()
  })
})
