import { supabase } from '@/lib/supabase'
import RapperDashboard from '@/components/RapperDashboard'
import { notFound } from 'next/navigation'

export default async function RapperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: rapper } = await supabase
    .from('rappers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!rapper) return notFound()

  const { data: bets } = await supabase
    .from('bets')
    .select('*')
    .eq('rapper_id', rapper.id)

  return <RapperDashboard rapper={rapper} bets={bets ?? []} />
}