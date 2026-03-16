export const revalidate = 0
import ProfilePage from '@/components/ProfilePage'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export default async function Profile() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: rappers } = await supabase.from('rappers').select('*')
  return <ProfilePage rappers={rappers ?? []} />
}