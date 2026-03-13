import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'

export default async function Home() {
  const { data: rappers, error } = await supabase
    .from('rappers')
    .select('*')
    .order('activity_score', { ascending: false })

  if (error) return <p>Erreur : {error.message}</p>

  return <AppShell rappers={rappers} />
}