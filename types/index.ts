export interface Rapper {
  id: string
  name: string
  slug: string
  city: string
  neighborhood: string
  latitude: number
  longitude: number
  short_bio: string
  category: string
  activity_score: number
  active_since: number
  social_links: Record<string, string>
}

export interface Bet {
  id: string
  amount: number
  multiplier: number
  status: string
  created_at: string
}

export interface Profile {
  id: string
  username: string
  balance: number
}