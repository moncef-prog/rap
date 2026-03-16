export const revalidate = 0
import { supabase } from '@/lib/supabase'
import BetsPage from '@/components/BetsPage'

export default async function Bets() {
  const { data: rappers } = await supabase
    .from('rappers')
    .select('*')
    .order('activity_score', { ascending: false })

  return <BetsPage rappers={rappers ?? []} />
}