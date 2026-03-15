import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('upcoming_projects')
    .select('*, rappers(name, slug, profile_image_url, category, activity_score)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ projects: data ?? [] })
}