export async function getChannelStats(channelId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY!
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=' + channelId + '&key=' + apiKey
  )
  const data = await res.json()
  const channel = data.items?.[0]
  if (!channel) return null

  return {
    subscribers: parseInt(channel.statistics?.subscriberCount ?? '0'),
    total_views: parseInt(channel.statistics?.viewCount ?? '0'),
    video_count: parseInt(channel.statistics?.videoCount ?? '0'),
    name: channel.snippet?.title,
    image: channel.snippet?.thumbnails?.high?.url,
  }
}

export async function searchYoutubeChannel(name: string) {
  const apiKey = process.env.YOUTUBE_API_KEY!
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + encodeURIComponent(name) + '&type=channel&maxResults=1&key=' + apiKey
  )
  const data = await res.json()
  const channel = data.items?.[0]
  if (!channel) return null

  return await getChannelStats(channel.id.channelId)
}