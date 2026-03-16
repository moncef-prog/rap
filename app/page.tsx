export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import AppShell from '@/components/AppShell'

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: rappers } = await supabase
    .from('rappers')
    .select('*')
    .order('activity_score', { ascending: false })

  return <AppShell rappers={rappers ?? []} />
}