'use client'

import { useState, useEffect } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import LeaguePage from '@/components/LeaguePage'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUDGET = 10000

function getRapperValue(score: number) {
  if (score >= 90) return 4000
  if (score >= 80) return 3000
  if (score >= 70) return 2000
  if (score >= 60) return 1500
  return 800
}

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87', mainstream: '#ff6b00', old_school: '#3b82f6', underground: '#a855f7',
}

const positions = [
  { top: '75%', left: '50%', role: 'Gardien' },
  { top: '55%', left: '20%', role: 'Défenseur' },
  { top: '55%', left: '80%', role: 'Défenseur' },
  { top: '30%', left: '30%', role: 'Milieu' },
  { top: '30%', left: '70%', role: 'Attaquant' },
]

function PlayerCard({ rapper, position }: { rapper: any; position: any }) {
  const color = categoryColors[rapper.category] ?? '#ff6b00'
  return (
    <div style={{
      position: 'absolute', top: position.top, left: position.left,
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 10,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: '3px solid ' + color,
        boxShadow: '0 0 20px ' + color + '99, 0 0 40px ' + color + '44',
        overflow: 'hidden', background: '#1a1a2e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {rapper.profile_image_url
          ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 28 }}>🎤</span>
        }
      </div>
      <div style={{ background: color, color: '#000', fontSize: '11px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px', boxShadow: '0 0 10px ' + color + '88' }}>{rapper.activity_score}</div>
      <div style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', border: '1px solid ' + color + '44', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>{rapper.name}</div>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{position.role}</div>
    </div>
  )
}

function FootballPitch({ team }: { team: any[] }) {
  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto',
      aspectRatio: '0.7', borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 0 60px rgba(0,0,0,0.8)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px), linear-gradient(160deg, #1a1a2e 0%, #0f0f1a 40%, #1a1208 100%)`,
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(255,107,0,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)' }} />
      <div style={{ position: 'absolute', inset: '12px', border: '3px solid rgba(255,107,0,0.6)', borderRadius: '4px', boxShadow: '0 0 12px rgba(255,107,0,0.3), inset 0 0 12px rgba(255,107,0,0.05)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '12px', right: '12px', height: '3px', background: 'rgba(255,107,0,0.6)', boxShadow: '0 0 8px rgba(255,107,0,0.4)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90px', height: '90px', border: '3px solid rgba(255,107,0,0.5)', borderRadius: '50%', boxShadow: '0 0 12px rgba(255,107,0,0.3)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '8px', height: '8px', background: '#ff6b00', borderRadius: '50%', boxShadow: '0 0 8px #ff6b00' }} />
      <div style={{ position: 'absolute', top: '12px', left: '28%', right: '28%', height: '16%', border: '3px solid rgba(255,107,0,0.4)', borderTop: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12px', left: '28%', right: '28%', height: '16%', border: '3px solid rgba(255,107,0,0.4)', borderBottom: 'none' }} />
      <div style={{ position: 'absolute', top: '8px', left: '40%', right: '40%', height: '22px', border: '3px solid rgba(255,200,0,0.7)', borderTop: 'none', background: 'rgba(255,200,0,0.05)', boxShadow: '0 0 10px rgba(255,200,0,0.4)' }} />
      <div style={{ position: 'absolute', bottom: '8px', left: '40%', right: '40%', height: '22px', border: '3px solid rgba(255,200,0,0.7)', borderBottom: 'none', background: 'rgba(255,200,0,0.05)', boxShadow: '0 0 10px rgba(255,200,0,0.4)' }} />
      <div style={{ position: 'absolute', top: '8%', left: '5%', fontSize: '11px', fontWeight: 900, color: 'rgba(255,107,0,0.15)', fontStyle: 'italic', transform: 'rotate(-15deg)', letterSpacing: '2px' }}>RAP MAP</div>
      <div style={{ position: 'absolute', bottom: '8%', right: '5%', fontSize: '11px', fontWeight: 900, color: 'rgba(168,85,247,0.15)', fontStyle: 'italic', transform: 'rotate(10deg)', letterSpacing: '2px' }}>MOROCCO</div>
      {team.map((rapper, i) => <PlayerCard key={rapper.id} rapper={rapper} position={positions[i]} />)}
    </div>
  )
}

export default function FantasyPage({ rappers }: { rappers: any[] }) {
  const router = useRouter()
  const [team, setTeam] = useState<any[]>([])
  const [budget, setBudget] = useState(BUDGET)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [existingTeam, setExistingTeam] = useState<any>(null)
  const [showPitch, setShowPitch] = useState(false)
  const [mainTab, setMainTab] = useState<'equipe' | 'ligues'>('equipe')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) loadExistingTeam(data.user.id)
    })
  }, [])

  const loadExistingTeam = async (userId: string) => {
    const { data: teamData } = await supabase
      .from('fantasy_teams')
      .select('*, fantasy_team_rappers(*, rappers(*))')
      .eq('user_id', userId)
      .single()

    if (teamData) {
      setExistingTeam(teamData)
      const members = teamData.fantasy_team_rappers.map((r: any) => r.rappers)
      setTeam(members)
      const spent = teamData.fantasy_team_rappers.reduce((acc: number, r: any) => acc + r.purchase_price, 0)
      setBudget(BUDGET - spent)
      if (members.length === 5) setShowPitch(true)
    }
  }

  const addRapper = (rapper: any) => {
    if (team.length >= 5) return
    if (team.find(r => r.id === rapper.id)) return
    const price = getRapperValue(rapper.activity_score)
    if (price > budget) return
    setTeam([...team, rapper])
    setBudget(budget - price)
  }

  const removeRapper = (rapper: any) => {
    setTeam(team.filter(r => r.id !== rapper.id))
    setBudget(budget + getRapperValue(rapper.activity_score))
  }

  const saveTeam = async () => {
    if (!user) { router.push('/'); return }
    if (team.length === 0) return
    setSaving(true)

    let teamId = existingTeam?.id
    if (!teamId) {
      const { data } = await supabase.from('fantasy_teams').insert({
        user_id: user.id, name: 'Mon Équipe', budget_remaining: budget,
      }).select().single()
      teamId = data?.id
    } else {
      await supabase.from('fantasy_team_rappers').delete().eq('team_id', teamId)
      await supabase.from('fantasy_teams').update({ budget_remaining: budget }).eq('id', teamId)
    }

    await supabase.from('fantasy_team_rappers').insert(
      team.map(r => ({ team_id: teamId, rapper_id: r.id, purchase_price: getRapperValue(r.activity_score) }))
    )

    setSaving(false)
    setShowPitch(true)
  }

  const totalScore = team.reduce((acc, r) => acc + r.activity_score, 0)
  const spent = BUDGET - budget

  return (
    <div style={{ minHeight: '100vh', background: '#08080c', color: 'white', padding: '24px', paddingTop: '84px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header + tabs principaux */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '4px' }}>
              🏆 <span style={{ color: '#ff6b00' }}>Fantasy</span> Rap Morocco
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Compose ton équipe · Défie tes amis · Gagne des Rivo</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {[
            { key: 'equipe', label: '⚽ Mon Équipe' },
            { key: 'ligues', label: '🏆 Ligues & Défis' },
          ].map(t => (
            <button key={t.key} onClick={() => setMainTab(t.key as any)} style={{
              padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600,
              background: mainTab === t.key ? '#ff6b00' : 'transparent',
              color: mainTab === t.key ? 'white' : 'rgba(255,255,255,0.4)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab Équipe */}
        {mainTab === 'equipe' && (
          <>
            {showPitch && team.length > 0 ? (
              <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px' }}>Mon Équipe</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Score : <span style={{ color: '#00ff87', fontWeight: 700 }}>{totalScore} pts</span></p>
                  </div>
                  <button onClick={() => setShowPitch(false)} style={{
                    padding: '10px 20px', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                    color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                  }}>✏️ Modifier</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'Joueurs', value: team.length + '/5', color: '#00ff87' },
                    { label: 'Score total', value: totalScore + ' pts', color: '#ff6b00' },
                    { label: 'Dépensé', value: '💊 ' + spent.toLocaleString(), color: '#3b82f6' },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '16px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', textAlign: 'center',
                    }}>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{s.label}</p>
                      <p style={{ fontSize: '20px', fontWeight: 900, color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <FootballPitch team={team} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {rappers.map(rapper => {
                      const price = getRapperValue(rapper.activity_score)
                      const inTeam = !!team.find(r => r.id === rapper.id)
                      const cantAfford = price > budget && !inTeam
                      const color = categoryColors[rapper.category] ?? '#ff6b00'
                      return (
                        <div key={rapper.id} onClick={() => inTeam ? removeRapper(rapper) : addRapper(rapper)}
                          style={{
                            padding: '16px', borderRadius: '16px', cursor: cantAfford ? 'not-allowed' : 'pointer',
                            background: inTeam ? color + '22' : 'rgba(255,255,255,0.03)',
                            border: '1px solid ' + (inTeam ? color : 'rgba(255,255,255,0.08)'),
                            opacity: cantAfford ? 0.4 : 1, transition: 'all 0.2s',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + color, flexShrink: 0, background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {rapper.profile_image_url
                                ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 18 }}>🎤</span>
                              }
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '14px' }}>{rapper.name}</p>
                              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{rapper.city}</p>
                            </div>
                            {inTeam && <span style={{ marginLeft: 'auto', fontSize: 18 }}>✅</span>}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: color + '22', color }}>{rapper.category.replace('_', ' ')}</span>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#ff6b00' }}>💊 {price.toLocaleString()}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ position: 'sticky', top: '84px', height: 'fit-content' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Mon Équipe</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '14px', background: 'rgba(255,107,0,0.08)', borderRadius: '12px', border: '1px solid rgba(255,107,0,0.2)' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>BUDGET RESTANT</p>
                        <p style={{ fontSize: '22px', fontWeight: 900, color: '#ff6b00' }}>💊 {budget.toLocaleString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>DÉPENSÉ</p>
                        <p style={{ fontSize: '22px', fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>💊 {spent.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const rapper = team[i]
                        const color = rapper ? (categoryColors[rapper.category] ?? '#ff6b00') : 'rgba(255,255,255,0.1)'
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', marginBottom: '8px', borderRadius: '12px', background: rapper ? color + '11' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (rapper ? color + '33' : 'rgba(255,255,255,0.06)') }}>
                            {rapper ? (
                              <>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + color, flexShrink: 0, background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {rapper.profile_image_url
                                    ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ fontSize: 16 }}>🎤</span>
                                  }
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontWeight: 700, fontSize: '13px' }}>{rapper.name}</p>
                                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>💊 {getRapperValue(rapper.activity_score).toLocaleString()}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeRapper(rapper) }} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 12 }}>✕</button>
                              </>
                            ) : (
                              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Slot {i + 1} — vide</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <button onClick={saveTeam} disabled={saving || team.length === 0} style={{
                      width: '100%', padding: '14px',
                      background: team.length > 0 ? 'linear-gradient(135deg, #ff6b00, #ff9500)' : 'rgba(255,255,255,0.05)',
                      border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800,
                      fontSize: '15px', cursor: team.length > 0 ? 'pointer' : 'not-allowed',
                      boxShadow: team.length > 0 ? '0 4px 20px rgba(255,107,0,0.3)' : 'none',
                    }}>
                      {saving ? 'Sauvegarde...' : `🏆 Valider l'équipe (${team.length}/5)`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab Ligues */}
        {mainTab === 'ligues' && <LeaguePage />}

      </div>
    </div>
  )
}