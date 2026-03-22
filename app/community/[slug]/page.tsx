import { createClient } from '@supabase/supabase-js'
import CommunityPage from '@/components/CommunityPage'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function Community({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: rapper } = await supabase
    .from('rappers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!rapper) return notFound()

  const { data: posts } = await supabase
    .from('community_posts')
    .select('*, profiles(username), community_comments(count), community_reactions(count)')
    .eq('rapper_id', rapper.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: followersCount } = await supabase
    .from('follows')
    .select('count')
    .eq('rapper_id', rapper.id)
    .single()

  return <CommunityPage rapper={rapper} posts={posts ?? []} followersCount={followersCount?.count ?? 0} />
}