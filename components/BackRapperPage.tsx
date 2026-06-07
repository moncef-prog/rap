'use client'

import { useState, useEffect } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { useIsMobile } from '@/lib/useIsMobile'
import type { Rapper, Back, BackGoal } from '@/types'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87', mainstream: '#E63946', old_school: '#3b82f6', underground: '#a855f7',
}

const levels = [
  { key: 'low', label: 'LOW', amount: 100, icon: '🧬', desc: 'Early Believer', color: '#3b82f6' },
  { key: 'medium', label: 'MEDIUM', amount: 500, icon: '🔥', desc: 'Top Supporter', color: '#E63946' },
  { key: 'high', label: 'HIGH', amount: 1000, icon: '🐋', desc: 'Whale', color: '#ffd700' },
]

function getBadge(amount: number, position: number) {
  if (position <= 10) return { label: 'OG 🎤', color: '#ffd700' }
  if (position <= 50) return { label: 'Early Believer 🧬', color: '#00ff87' }
  if (amount >= 1000) return { label: 'Whale 🐋', color: '#ffd700' }
  if (amount >= 500) return { label: 'Top Supporter 🔥', color: '#E63946' }
  return { label: 'Believer', color: '#3b82f6' }
}

export default function BackRapperPage({ rapper, backs, goals }: { rapper: Rapper, backs: Back[], goals: BackGoal[] }) {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [userBack, setUserBack] = useState<Back | null>(null)
  const [selectedLevel, setSelectedLevel] = useState(levels[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const isMobile = useIsMobile()
  const color = categoryColors[rapper.category] ?? '#E63946'
  const totalBackers = backs.length
  const totalBacked = backs.reduce((acc, b) => acc + b.amount, 0)
  const hyper = Math.min(99, Math.round((totalBackers * 2 + totalBacked / 100)))

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        const existing = backs.find(b => b.user_id === data.user?.id)
        setUserBack(existing ?? null)
      }
    })
  }, [])

  const handleBack = async () => {
    if (!user) { setMessage('❌ Connecte-toi pour soutenir'); return }
    if (userBack) { setMessage('❌ Tu soutiens déjà cet artiste'); return }
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setMessage('❌ Connecte-toi pour soutenir'); setLoading(false); return }

    const res = await fetch('/api/back/place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        rapper_id: rapper.id,
        level: selectedLevel.key,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const errorMessage = data.error === 'Insufficient balance'
        ? '❌ Balance insuffisante'
        : data.error === 'Already backed'
          ? '❌ Tu soutiens déjà cet artiste'
          : '❌ ' + (data.error ?? 'Erreur')
      setMessage(errorMessage)
      setLoading(false)
      return
    }

    setMessage('✅ Tu soutiens maintenant ' + rapper.name + ' ! Badge : ' + data.back.badge)
    setLoading(false)
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060606', color: 'white', paddingTop: '60px', fontFamily: 'Inter, sans-serif' }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${color}22 0%, transparent 100%)`,
        borderBottom: `1px solid ${color}33`,
        padding: '40px 24px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <a href={`/rapper/${rapper.slug}`} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '24px' }}>← Retour</a>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${color}`, boxShadow: `0 0 30px ${color}66`, flexShrink: 0 }}>
              {rapper.profile_image_url
                ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎤</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '6px' }}>{rapper.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '12px' }}>📍 {rapper.city}</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color, background: color + '22', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${color}44` }}>
                  {rapper.category.replace('_', ' ').toUpperCase()}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px' }}>
                  Score {rapper.activity_score}
                </span>
              </div>
            </div>

            {/* Hype score */}
            <div style={{ textAlign: isMobile ? 'left' : 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '52px', fontWeight: 900, color, lineHeight: 1 }}>{hyper}%</div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Hype Score</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Backers', value: totalBackers, icon: '👥' },
              { label: 'Total Rivo stakés', value: totalBacked.toLocaleString() + ' 💊', icon: '💰' },
              { label: 'Early Believers', value: backs.filter((_, i) => i < 50).length, icon: '🧬' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{s.icon} {s.label}</p>
                <p style={{ fontSize: '22px', fontWeight: 900, color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: '24px' }}>

        {/* Gauche — Goals + Top Backers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Community Goals */}
          {goals.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🎯 Community Goals</h2>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Objectifs fix&eacute;s par l&apos;artiste</p>
              </div>
              {goals.map(goal => {
                const progress = Math.min(100, Math.round((totalBackers / goal.target_backers) * 100))
                return (
                  <div key={goal.id} style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <p style={{ fontWeight: 700, fontSize: '15px' }}>{goal.title}</p>
                      <span style={{ fontSize: '13px', color, fontWeight: 700 }}>{progress}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: '8px', overflow: 'hidden' }}>
                      <div style={{ width: progress + '%', height: '100%', background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      {totalBackers} / {goal.target_backers} backers
                    </p>
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)', borderRadius: '10px' }}>
                      <p style={{ fontSize: '13px', color: '#00ff87', fontWeight: 600 }}>🎁 Récompense : {goal.reward_description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Top Backers */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🏆 Top Backers</h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Les fans qui croient le plus fort</p>
            </div>
            {backs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🧬</p>
                <p style={{ fontWeight: 700, marginBottom: '6px' }}>Sois le premier à croire</p>
                <p style={{ fontSize: '13px' }}>Les early believers gagnent le plus</p>
              </div>
            ) : (
              backs.slice(0, 20).map((back, i) => {
                const badge = getBadge(back.amount, i + 1)
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={back.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 24px',
                    borderBottom: i < Math.min(backs.length, 20) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: back.user_id === user?.id ? 'rgba(230,57,70,0.05)' : 'transparent',
                  }}>
                    <span style={{ fontSize: '18px', width: 28, textAlign: 'center' }}>
                      {medals[i] ?? <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>#{i + 1}</span>}
                    </span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: color + '33', border: '2px solid ' + color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>
                      {back.profiles?.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '14px' }}>
                        {back.profiles?.username}
                        {back.user_id === user?.id && <span style={{ marginLeft: 8, fontSize: '11px', color: '#E63946' }}>(toi)</span>}
                      </p>
                      <span style={{ fontSize: '11px', color: badge.color, background: badge.color + '22', padding: '2px 8px', borderRadius: '20px' }}>{badge.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, fontSize: '15px', color }}>💊 {back.amount.toLocaleString()}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{back.level}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Droite — Back Panel */}
        <div style={{ position: isMobile ? 'static' : 'sticky', top: '80px', height: 'fit-content' }}>
          <div style={{ background: 'rgba(15,15,25,0.95)', border: `1px solid ${color}33`, borderRadius: '24px', padding: '28px', boxShadow: `0 0 40px ${color}10` }}>

            {userBack ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>✅</p>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Tu soutiens {rapper.name}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Tu fais partie de la communauté</p>
                <div style={{ padding: '14px', background: color + '15', borderRadius: '12px', border: `1px solid ${color}33` }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Ton badge</p>
                  <p style={{ fontSize: '18px', fontWeight: 800, color }}>{userBack.badge}</p>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '6px' }}>BACK {rapper.name.toUpperCase()}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>
                  Crois en lui avant tout le monde &mdash; gagne plus si t&apos;avais raison
                </p>

                {/* Niveaux */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {levels.map(level => (
                    <div key={level.key} onClick={() => setSelectedLevel(level)}
                      style={{
                        padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                        border: `1px solid ${selectedLevel.key === level.key ? level.color : 'rgba(255,255,255,0.08)'}`,
                        background: selectedLevel.key === level.key ? level.color + '15' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{level.icon}</span>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: '14px', color: selectedLevel.key === level.key ? level.color : 'white' }}>{level.label}</p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{level.desc}</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, fontSize: '16px', color: level.color }}>💊 {level.amount}</span>
                    </div>
                  ))}
                </div>

                {/* Position info */}
                <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Ta position</p>
                    <p style={{ fontWeight: 800, fontSize: '16px' }}>#{totalBackers + 1}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Ton badge</p>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: getBadge(selectedLevel.amount, totalBackers + 1).color }}>
                      {getBadge(selectedLevel.amount, totalBackers + 1).label}
                    </p>
                  </div>
                </div>

                {message && (
                  <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '12px', textAlign: 'center', background: message.includes('✅') ? 'rgba(0,255,135,0.1)' : 'rgba(255,68,68,0.1)', border: '1px solid ' + (message.includes('✅') ? 'rgba(0,255,135,0.3)' : 'rgba(255,68,68,0.3)'), color: message.includes('✅') ? '#00ff87' : '#ff4444', fontSize: '14px', fontWeight: 600 }}>{message}</div>
                )}

                <button onClick={handleBack} disabled={loading} style={{
                  width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 900,
                  background: loading ? 'rgba(230,57,70,0.4)' : `linear-gradient(135deg, ${color}, ${color}88)`,
                  color: 'white', boxShadow: `0 4px 30px ${color}44`, letterSpacing: '0.5px',
                }}>
                  {loading ? '...' : `BACK ${rapper.name.toUpperCase()} 🔥`}
                </button>

                <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>
                  Monnaie fictive — aucune valeur réelle
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
