'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87',
  mainstream: '#ff6b00',
  old_school: '#3b82f6',
  underground: '#a855f7',
}

const trendingBets = [
  { label: 'Rapper Enters Top 5', multiplier: 'x1.7', icon: '📈' },
  { label: 'Dépasse 1 Million Streams', multiplier: 'x2.1', icon: '🎵' },
  { label: '#1 Pendant 3 Jours', multiplier: 'x2.5', icon: '👑' },
  { label: 'Nouvelle Sortie ce Mois', multiplier: 'x1.4', icon: '🎤' },
  { label: 'Collab avec un International', multiplier: 'x3.2', icon: '🌍' },
]

interface Rapper {
  id: string
  name: string
  slug: string
  city: string
  category: string
  activity_score: number
  profile_image_url?: string
}

interface Props {
  rappers: Rapper[]
}

function BetsPage({ rappers }: Props) {
  const [selectedRapper, setSelectedRapper] = useState<Rapper>(rappers[0])
  const [selectedBetType, setSelectedBetType] = useState(trendingBets[0])
  const [amount, setAmount] = useState(200)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('Top Entries')
  const [search, setSearch] = useState('')

  const filteredRappers = rappers.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.city.toLowerCase().includes(search.toLowerCase())
  )

  const multiplier = (selectedRapper.activity_score / 100 + 0.8).toFixed(1)

  const placeBet = async () => {
    setLoading(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('❌ Connecte-toi pour parier'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    if (!profile || profile.balance < amount) { setMessage('❌ Balance insuffisante'); setLoading(false); return }
    await supabase.from('profiles').update({ balance: profile.balance - amount }).eq('id', user.id)
    await supabase.from('bets').insert({ user_id: user.id, rapper_id: selectedRapper.id, amount, multiplier: Number(multiplier), status: 'active' })
    setMessage('✅ Pari placé !')
    setLoading(false)
    setTimeout(() => { setMessage(''); window.location.reload() }, 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08080c', color: 'white', fontFamily: 'Inter, sans-serif', paddingTop: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '4px' }}>🎯 BET ON RAPPERS</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Mise sur les rappeurs marocains et multiplie tes Rivo</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {['Top Entries', 'Trending Songs', 'New Drops'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600,
              background: activeTab === tab ? '#ff6b00' : 'transparent',
              color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.4)',
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🔥 Hot Bets</h2>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{filteredRappers.length} rappeurs</span>
                </div>
                {/* Barre de recherche */}
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '16px', pointerEvents: 'none',
                  }}>🔍</span>
                  <input
                    placeholder="Recherche un rappeur ou une ville..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px 12px 42px',
                      borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)', color: 'white',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                      width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', fontSize: '11px',
                    }}>✕</button>
                  )}
                </div>
              </div>

              {filteredRappers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  Aucun rappeur trouvé pour "{search}"
                </div>
              ) : (
                filteredRappers.map((rapper, i) => {
                  const color = categoryColors[rapper.category] ?? '#ff6b00'
                  const gain = [1250, 850, 400, 200][i] ?? 150
                  return (
                    <div key={rapper.id} onClick={() => setSelectedRapper(rapper)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', cursor: 'pointer',
                        borderBottom: i < filteredRappers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: selectedRapper.id === rapper.id ? 'rgba(255,107,0,0.05)' : 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedRapper.id === rapper.id ? 'rgba(255,107,0,0.05)' : 'transparent'}
                    >
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                        overflow: 'hidden', border: '2px solid ' + color,
                        background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 10px ' + color + '44',
                      }}>
                        {rapper.profile_image_url
                          ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '22px' }}>🎤</span>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px' }}>{rapper.name}</span>
                          <span style={{ fontSize: '11px', color: color, background: color + '22', padding: '2px 8px', borderRadius: '10px' }}>{rapper.category.replace('_', ' ')}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>📍 {rapper.city} · Score {rapper.activity_score}</p>
                      </div>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#00ff87' }}>+{gain} 💊</p>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>📊 Trending Bets</h2>
              </div>
              {trendingBets.map((bet, i) => (
                <div key={i} onClick={() => setSelectedBetType(bet)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px', cursor: 'pointer',
                    borderBottom: i < trendingBets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: selectedBetType.label === bet.label ? 'rgba(255,107,0,0.05)' : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = selectedBetType.label === bet.label ? 'rgba(255,107,0,0.05)' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '24px' }}>{bet.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{bet.label}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#ff6b00' }}>{bet.multiplier}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
            <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 0 40px rgba(255,107,0,0.1)' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.3), rgba(255,150,0,0.1))', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>🎯 Featured Bet</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
                    overflow: 'hidden', border: '2px solid ' + (categoryColors[selectedRapper.category] ?? '#ff6b00'),
                    background: (categoryColors[selectedRapper.category] ?? '#ff6b00') + '33',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px ' + (categoryColors[selectedRapper.category] ?? '#ff6b00') + '66',
                  }}>
                    {selectedRapper.profile_image_url
                      ? <img src={selectedRapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '28px' }}>🎤</span>
                    }
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{selectedRapper.name}</h3>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>📍 {selectedRapper.city}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>
                <div style={{ padding: '14px', borderRadius: '12px', marginBottom: '20px', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Type de pari</p>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>{selectedBetType.icon} {selectedBetType.label}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Cote</p>
                    <p style={{ fontSize: '24px', fontWeight: 900, color: '#ff6b00' }}>x{multiplier}</p>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Chance</p>
                    <p style={{ fontSize: '24px', fontWeight: 900, color: '#00ff87' }}>{selectedRapper.activity_score}%</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {[100, 200, 500, 1000].map(a => (
                    <button key={a} onClick={() => setAmount(a)} style={{
                      flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 700,
                      background: amount === a ? '#ff6b00' : 'rgba(255,255,255,0.06)',
                      color: amount === a ? 'white' : 'rgba(255,255,255,0.5)',
                    }}>{a}</button>
                  ))}
                </div>

                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '16px', fontWeight: 700, outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', marginBottom: '16px', background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Gain potentiel</p>
                    <p style={{ fontSize: '22px', fontWeight: 900, color: '#00ff87' }}>{Math.round(amount * Number(multiplier))} 💊</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Mise</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{amount} 💊</p>
                  </div>
                </div>

                {message && (
                  <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '12px', textAlign: 'center', background: message.includes('✅') ? 'rgba(0,255,135,0.1)' : 'rgba(255,68,68,0.1)', border: '1px solid ' + (message.includes('✅') ? 'rgba(0,255,135,0.3)' : 'rgba(255,68,68,0.3)'), color: message.includes('✅') ? '#00ff87' : '#ff4444', fontSize: '14px', fontWeight: 600 }}>{message}</div>
                )}

                <button onClick={placeBet} disabled={loading} style={{
                  width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 800,
                  background: loading ? 'rgba(255,107,0,0.4)' : 'linear-gradient(135deg, #ff6b00, #ff9500)',
                  color: 'white', boxShadow: '0 4px 30px rgba(255,107,0,0.4)',
                }}>
                  {loading ? 'En cours...' : 'PLACE BET 🔥'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BetsPage