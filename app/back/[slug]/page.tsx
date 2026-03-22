import { createClient } from '@supabase/supabase-js'
import BackRapperPage from '@/components/BackRapperPage'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function BackPage({ params }: { params: Promise<{ slug: string }> }) {
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

  const { data: backs } = await supabase
    .from('backs')
    .select('*, profiles(username)')
    .eq('rapper_id', rapper.id)
    .order('amount', { ascending: false })

  const { data: goals } = await supabase
    .from('community_goals')
    .select('*')
    .eq('rapper_id', rapper.id)
    .order('created_at', { ascending: false })

  return <BackRapperPage rapper={rapper} backs={backs ?? []} goals={goals ?? []} />
}