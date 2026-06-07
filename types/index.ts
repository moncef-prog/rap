export interface Rapper {
  id: string
  name: string
  slug?: string
  city: string
  neighborhood: string
  latitude: number
  longitude: number
  short_bio: string
  category: string
  activity_score: number
  social_links: Record<string, string>
  profile_image_url?: string
  spotify_id?: string
  spotify_followers?: number
  spotify_popularity?: number
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

export interface Song {
  id: string
  name: string
  artist: string
  album_image: string
  popularity: number
  preview_url: string | null
  spotify_url: string
}

export interface UpcomingProject {
  id: string
  title: string
  type: string
  release_date: string | null
  release_date_known: boolean
  created_at: string
  rappers: Pick<Rapper, 'name' | 'slug' | 'profile_image_url' | 'category' | 'activity_score'> | null
}

export interface Back {
  id: string
  user_id: string
  rapper_slug: string
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  amount: number
  badge?: string
  created_at: string
  profiles?: Pick<Profile, 'username'>
}

export interface BackGoal {
  id: string
  rapper_slug: string
  title: string
  target: number
  current: number
  target_backers: number
  reward_description: string
}

export interface Post {
  id: string
  rapper_slug: string
  user_id: string
  content: string
  type: 'text' | 'image' | 'announcement' | 'poll' | 'challenge'
  is_pinned?: boolean
  image_url?: string
  poll_options?: string | string[]
  challenge_condition?: string
  challenge_reward?: string
  created_at: string
  profiles: Pick<Profile, 'username'>
  community_reactions?: { count: number }[]
  community_comments?: { count: number }[]
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles: Pick<Profile, 'username'>
}

export interface Conversation {
  id: string
  name: string | null
  type: 'private' | 'group'
  is_group: boolean
  created_at: string
  conversation_members: ConversationMember[]
}

export interface ConversationMember {
  id: string
  conversation_id: string
  user_id: string
  profiles: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  profiles: Pick<Profile, 'username'>
}

export interface Friendship {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  sender?: Pick<Profile, 'id' | 'username'>
  receiver?: Pick<Profile, 'id' | 'username'>
  profiles: Profile
}

export interface FantasyTeamRapper {
  id?: string
  rappers: Rapper
  purchase_price: number
}

export interface FantasyTeam {
  id: string
  user_id: string
  league_id: string | null
  total_points?: number
  fantasy_team_rappers: FantasyTeamRapper[]
}

export interface League {
  id: string
  name: string
  code: string
  creator_id: string
  created_at: string
}

export interface LeagueMember {
  id: string
  league_id: string
  user_id: string
  profiles: Profile
  leagues?: League
  fantasy_teams?: { total_points: number }
}

export type ProfileSearch = Pick<Profile, 'id' | 'username'>
