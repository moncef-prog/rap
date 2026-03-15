'use client'

import { useState, useEffect } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87', mainstream: '#E63946', old_school: '#3b82f6', underground: '#a855f7',
}

export default function ProfilePage({ rappers }: { rappers: any[] }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [bets, setBets] = useState<any[]>([])
  const [fantasyTeam, setFantasyTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)
      loadAll(data.user.id)
    })
  }, [])

  const loadAll = async (userId: string) => {
    const [{ data: prof }, { data: betsData }, { data: teamData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bets').select('*, rappers(name, profile_image_url, category)').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('fantasy_teams').select('*, fantasy_team_rappers(*, rappers(*))').eq('user_id', userId).single(),
    ])
    setProfile(prof)
    setBets(betsData ?? [])
    setFantasyTeam(teamData)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#08080c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      Chargement...
    </div>
  )

  const totalMise = bets.reduce((acc, b) => acc + b.amount, 0)
  const activeBets = bets.filter(b => b.status === 'active').length

  return (
    <div style={{ minHeight: '100vh', background: '#08080c', color: 'white', padding: '24px', paddingTop: '84px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px',
          padding: '28px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #E63946, #C1121F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 900, flexShrink: 0,
          }}>
            {profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px' }}>{profile?.username}</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{user?.email}</p>
          </div>
          <div style={{
            padding: '16px 24px', background: 'rgba(230,57,70,0.1)',
            border: '1px solid rgba(230,57,70,0.2)', borderRadius: '16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>BALANCE</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#E63946' }}>💊 {profile?.balance?.toLocaleString()}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total misé', value: '💊 ' + totalMise.toLocaleString(), color: '#E63946' },
            { label: 'Paris actifs', value: activeBets, color: '#00ff87' },
            { label: 'Paris total', value: bets.length, color: '#3b82f6' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '20px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>{stat.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {fantasyTeam && (
          <div style={{
            marginBottom: '32px', padding: '24px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>🏆 Mon Équipe Fantasy</h2>
              <a href="/fantasy" style={{ fontSize: '13px', color: '#E63946', textDecoration: 'none' }}>Modifier →</a>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {fantasyTeam.fantasy_team_rappers.map((member: any) => {
                const rapper = member.rappers
                const color = categoryColors[rapper.category] ?? '#E63946'
                return (
                  <div key={member.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', background: color + '11',
                    border: '1px solid ' + color + '33', borderRadius: '12px',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                      border: '2px solid ' + color, flexShrink: 0,
                      background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {rapper.profile_image_url
                        ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 16 }}>🎤</span>
                      }
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '13px' }}>{rapper.name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>💊 {member.purchase_price.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{
          padding: '24px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>📋 Historique des Paris</h2>
          {bets.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px' }}>Aucun pari pour l'instant</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bets.map(bet => {
                const color = categoryColors[bet.rappers?.category] ?? '#E63946'
                return (
                  <div key={bet.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                      border: '2px solid ' + color, flexShrink: 0,
                      background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {bet.rappers?.profile_image_url
                        ? <img src={bet.rappers.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 16 }}>🎤</span>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '14px' }}>{bet.rappers?.name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(bet.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: '#E63946' }}>💊 {bet.amount}</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>x{bet.multiplier}</p>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                      background: bet.status === 'active' ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)',
                      color: bet.status === 'active' ? '#00ff87' : 'rgba(255,255,255,0.3)',
                    }}>{bet.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
