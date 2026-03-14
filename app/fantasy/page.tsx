import { createClient } from '@/lib/supabase-server'
import FantasyPage from '@/components/FantasyPage'

export default async function Fantasy() {
  const supabase = createClient()
  const { data: rappers } = await supabase
    .from('rappers')
    .select('*')
    .order('activity_score', { ascending: false })

  return <FantasyPage rappers={rappers ?? []} />
}