'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useIsMobile } from '@/lib/useIsMobile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87',
  mainstream: '#E63946',
  old_school: '#3b82f6',
  underground: '#a855f7',
}

const trendingBetTypes = [
  { key: 'top5', label: 'Rapper Enters Top 5', multiplier: 1.7, icon: '📈', desc: 'Le rappeur entre dans le top 5 cette semaine' },
  { key: 'streams1m', label: 'Song reaches 1M Streams', multiplier: 2.1, icon: '🎵', desc: 'Une chanson dépasse 1 million de streams' },
  { key: 'top1_3days', label: 'Song stays #1 for 3 days', multiplier: 2.5, icon: '👑', desc: 'Reste numéro 1 pendant 3 jours consécutifs' },
  { key: 'top10_drop', label: 'New drop reaches Top 10', multiplier: 1.4, icon: '🎤', desc: 'Nouvelle sortie entre dans le top 10' },
  { key: 'collab', label: 'International Collab', multiplier: 3.2, icon: '🌍', desc: 'Collaboration avec un artiste international' },
]

const chartsBetTypes = [
  { key: 'enter_top5', label: '📈 Entre dans le Top 5', multiplier: 1.9 },
  { key: 'stay_top10', label: '🔒 Reste dans le Top 10', multiplier: 1.4 },
  { key: 'lose_places', label: '📉 Va perdre des places', multiplier: 2.2 },
  { key: 'exit_charts', label: '💨 Va sortir du classement', multiplier: 2.8 },
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

export default function BetsPage({ rappers }: Props) {
  const [selectedRapper, setSelectedRapper] = useState<Rapper>(rappers[0])
  const [selectedBetType, setSelectedBetType] = useState(trendingBetTypes[0])
  const [selectedChartsBet, setSelectedChartsBet] = useState(chartsBetTypes[0])
  const [amount, setAmount] = useState(200)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('Trending Bets')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [trendingSongs, setTrendingSongs] = useState<any[]>([])
  const [loadingSongs, setLoadingSongs] = useState(false)
  const [upcomingProjects, setUpcomingProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [projectBetType, setProjectBetType] = useState('success')
  const [betMode, setBetMode] = useState<'trending' | 'charts' | 'project'>('trending')
  const isMobile = useIsMobile()

  useEffect(() => {
    if (activeTab === 'Trending Songs' && trendingSongs.length === 0) {
      setLoadingSongs(true)
      fetch('/api/trending-songs')
        .then(r => r.json())
        .then(data => { setTrendingSongs(data.tracks ?? []); setLoadingSongs(false) })
    }
    if (activeTab === 'New Drops' && upcomingProjects.length === 0) {
      setLoadingProjects(true)
      fetch('/api/upcoming-projects')
        .then(r => r.json())
        .then(data => { setUpcomingProjects(data.projects ?? []); setLoadingProjects(false) })
    }
  }, [activeTab])

  const filteredRappers = rappers
    .sort((a, b) => b.activity_score - a.activity_score)
    .filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase())
    )

  const displayedRappers = search.length > 0 ? filteredRappers : (showAll ? filteredRappers : filteredRappers.slice(0, 5))

  const getProjectOdds = (score: number, type: string): number => {
    if (score >= 90) return ({ success: 1.2, flop: 4.0, top1: 2.5, better: 1.4, international: 3.5 } as any)[type] ?? 1.5
    if (score >= 70) return ({ success: 1.8, flop: 2.5, top1: 3.2, better: 2.0, international: 4.0 } as any)[type] ?? 2.0
    return ({ success: 2.5, flop: 1.5, top1: 4.5, better: 2.8, international: 5.0 } as any)[type] ?? 2.5
  }

  const multiplier = betMode === 'project'
    ? getProjectOdds(selectedRapper.activity_score, projectBetType)
    : betMode === 'charts'
      ? selectedChartsBet.multiplier
      : selectedBetType.multiplier

  const betLabel = betMode === 'project'
    ? ({ success: '🔥 Succès', flop: '💀 Flop', better: '📈 Dépasse son dernier', top1: '👑 Top 1 Maroc', international: '🌍 Buzz international' } as any)[projectBetType]
    : betMode === 'charts'
      ? selectedChartsBet.label
      : selectedBetType.icon + ' ' + selectedBetType.label

  const placeBet = async () => {
    setLoading(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('❌ Connecte-toi pour parier'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    if (!profile || profile.balance < amount) { setMessage('❌ Balance insuffisante'); setLoading(false); return }
    await supabase.from('profiles').update({ balance: profile.balance - amount }).eq('id', user.id)
    await supabase.from('bets').insert({
      user_id: user.id,
      rapper_id: selectedRapper.id,
      amount, multiplier, status: 'active',
      project_id: selectedProject?.id ?? null,
      bet_type: betMode === 'project' ? projectBetType : betMode === 'charts' ? selectedChartsBet.key : selectedBetType.key,
    })
    setMessage('✅ Pari placé !')
    setLoading(false)
    setTimeout(() => { setMessage(''); window.location.reload() }, 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08080c', color: 'white', fontFamily: 'Inter, sans-serif', paddingTop: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 24px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '4px' }}>🎯 BET ON RAPPERS</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Mise sur les rappeurs marocains et multiplie tes Rivo</p>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
          {['Trending Bets', 'Top Entries', 'Trending Songs', 'New Drops'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); setShowAll(false) }} style={{
              padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px', fontWeight: 600, whiteSpace: 'nowrap',
              background: activeTab === tab ? '#E63946' : 'transparent',
              color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.4)',
              flexShrink: 0,
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* TRENDING BETS TAB */}
            {activeTab === 'Trending Bets' && (
              <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700 }}>📊 Trending Bets</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Les paris les plus populaires — choisis un type puis un rappeur</p>
                </div>
                {trendingBetTypes.map((bet, i) => (
                  <div key={i} onClick={() => { setSelectedBetType(bet); setBetMode('trending') }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '18px 24px', cursor: 'pointer',
                      borderBottom: i < trendingBetTypes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: selectedBetType.key === bet.key && betMode === 'trending' ? 'rgba(230,57,70,0.08)' : 'transparent',
                      borderLeft: selectedBetType.key === bet.key && betMode === 'trending' ? '3px solid #E63946' : '3px solid transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = selectedBetType.key === bet.key && betMode === 'trending' ? 'rgba(230,57,70,0.08)' : 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '28px' }}>{bet.icon}</span>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '3px' }}>{bet.label}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{bet.desc}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#E63946', flexShrink: 0 }}>x{bet.multiplier}</span>
                  </div>
                ))}

                {/* Sélection rappeur inline */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', fontWeight: 600 }}>CHOISIR UN RAPPEUR</p>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
                    <input placeholder="Recherche..." value={search} onChange={e => setSearch(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {filteredRappers.slice(0, showAll ? 999 : 8).map(rapper => {
                      const color = categoryColors[rapper.category] ?? '#E63946'
                      const isSelected = selectedRapper.id === rapper.id && betMode === 'trending'
                      return (
                        <div key={rapper.id} onClick={() => { setSelectedRapper(rapper); setBetMode('trending') }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
                            borderRadius: '20px', cursor: 'pointer',
                            border: '1px solid ' + (isSelected ? '#E63946' : 'rgba(255,255,255,0.08)'),
                            background: isSelected ? 'rgba(230,57,70,0.12)' : 'rgba(255,255,255,0.03)',
                          }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', border: '1px solid ' + color, flexShrink: 0 }}>
                            {rapper.profile_image_url
                              ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', background: color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🎤</div>
                            }
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? 'white' : 'rgba(255,255,255,0.6)' }}>{rapper.name}</span>
                        </div>
                      )
                    })}
                    {filteredRappers.length > 8 && !showAll && (
                      <button onClick={() => setShowAll(true)} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>
                        +{filteredRappers.length - 8} autres
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TOP ENTRIES TAB */}
            {activeTab === 'Top Entries' && (
              <>
                <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700 }}>📊 Charts Movement</h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Parie sur le mouvement dans les classements</p>
                      </div>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{filteredRappers.length} rappeurs</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
                      <input placeholder="Recherche un rappeur..." value={search} onChange={e => { setSearch(e.target.value); setShowAll(false) }}
                        style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                      {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', fontSize: '11px' }}>✕</button>}
                    </div>
                  </div>
                  {filteredRappers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Aucun rappeur trouvé</div>
                  ) : (
                    <>
                      {displayedRappers.map((rapper, i) => {
                        const color = categoryColors[rapper.category] ?? '#E63946'
                        const isSelected = selectedRapper.id === rapper.id && betMode === 'charts'
                        return (
                          <div key={rapper.id} onClick={() => { setSelectedRapper(rapper); setBetMode('charts') }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', cursor: 'pointer',
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              background: isSelected ? 'rgba(230,57,70,0.05)' : 'transparent',
                              borderLeft: isSelected ? '3px solid #E63946' : '3px solid transparent',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(230,57,70,0.05)' : 'transparent'}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', width: 20 }}>#{i + 1}</span>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid ' + color, background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {rapper.profile_image_url
                                ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: '22px' }}>🎤</span>
                              }
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 700, fontSize: '15px' }}>{rapper.name}</span>
                                <span style={{ fontSize: '11px', color, background: color + '22', padding: '2px 8px', borderRadius: '10px' }}>{rapper.category.replace('_', ' ')}</span>
                              </div>
                              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>📍 {rapper.city} · Score {rapper.activity_score}</p>
                            </div>
                          </div>
                        )
                      })}
                      {!search && filteredRappers.length > 5 && (
                        <button onClick={() => setShowAll(!showAll)} style={{ width: '100%', padding: '14px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'white'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                        >
                          {showAll ? '▲ Voir moins' : `▼ Voir plus — ${filteredRappers.length - 5} rappeurs restants`}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Types de paris charts */}
                <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🎯 Type de mouvement</h2>
                  </div>
                  {chartsBetTypes.map((bet, i) => (
                    <div key={i} onClick={() => { setSelectedChartsBet(bet); setBetMode('charts') }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 24px', cursor: 'pointer',
                        borderBottom: i < chartsBetTypes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: selectedChartsBet.key === bet.key && betMode === 'charts' ? 'rgba(230,57,70,0.08)' : 'transparent',
                        borderLeft: selectedChartsBet.key === bet.key && betMode === 'charts' ? '3px solid #E63946' : '3px solid transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedChartsBet.key === bet.key && betMode === 'charts' ? 'rgba(230,57,70,0.08)' : 'transparent'}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{bet.label}</span>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#E63946' }}>x{bet.multiplier}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* TRENDING SONGS TAB */}
            {activeTab === 'Trending Songs' && (
              <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🎵 Trending Songs — Rap Maroc</h2>
                </div>
                {loadingSongs ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Chargement...</div>
                ) : trendingSongs.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Aucun résultat</div>
                ) : (
                  trendingSongs.map((track, i) => (
                    <a key={track.id} href={track.spotify_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 24px', borderBottom: i < trendingSongs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', textDecoration: 'none', color: 'white', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', width: 20 }}>{i + 1}</span>
                      <img src={track.album_image} alt={track.name} style={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{track.name}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{track.artist}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                          <div style={{ width: track.popularity + '%', height: '100%', background: '#E63946', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', width: 24 }}>{track.popularity}</span>
                      </div>
                      <span style={{ fontSize: '16px', color: '#1DB954' }}>▶</span>
                    </a>
                  ))
                )}
              </div>
            )}

            {/* NEW DROPS TAB */}
            {activeTab === 'New Drops' && (
              <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🔜 Projets à venir</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Parie sur le succès ou le flop</p>
                </div>
                {loadingProjects ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Chargement...</div>
                ) : upcomingProjects.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Aucun projet</div>
                ) : (
                  upcomingProjects.map((project, i) => {
                    const color = (categoryColors as any)[project.rappers?.category] ?? '#E63946'
                    const score = project.rappers?.activity_score ?? 50
                    const isSelected = selectedProject?.id === project.id

                    const projectBetTypes = [
                      { key: 'success', label: '🔥 Succès', desc: 'Le projet cartonne' },
                      { key: 'flop', label: '💀 Flop', desc: 'Moins que prévu' },
                      { key: 'better', label: '📈 Dépasse son dernier', desc: 'Meilleur que le précédent' },
                      { key: 'top1', label: '👑 Top 1 Maroc', desc: 'Atteint la 1ère place' },
                      { key: 'international', label: '🌍 Buzz international', desc: 'Dépasse les frontières' },
                    ]

                    return (
                      <div key={project.id} style={{ borderBottom: i < upcomingProjects.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', cursor: 'pointer',
                          background: isSelected ? 'rgba(230,57,70,0.05)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #E63946' : '3px solid transparent',
                        }} onClick={() => { setSelectedProject(isSelected ? null : project); if (!isSelected) { setSelectedRapper(project.rappers); setBetMode('project') } }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid ' + color, background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {project.rappers?.profile_image_url
                              ? <img src={project.rappers.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: 20 }}>🎤</span>
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '15px' }}>{project.rappers?.name}</span>
                              <span style={{ fontSize: '11px', color, background: color + '22', padding: '2px 8px', borderRadius: '10px' }}>{project.type}</span>
                              {score >= 80 && <span style={{ fontSize: '11px', color: '#E63946', background: 'rgba(230,57,70,0.1)', padding: '2px 8px', borderRadius: '10px' }}>🔥 Hype</span>}
                            </div>
                            <p style={{ fontSize: '13px', color: 'white', fontWeight: 600, marginBottom: '2px' }}>"{project.title}"</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                              {project.release_date_known && project.release_date ? '📅 ' + new Date(project.release_date).toLocaleDateString('fr-FR') : '📅 Date TBA'} · Score : <span style={{ color }}>{score}</span>
                            </p>
                          </div>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{isSelected ? '▲' : '▼'}</span>
                        </div>

                        {isSelected && (
                          <div style={{ padding: '0 24px 16px', background: 'rgba(230,57,70,0.02)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              {projectBetTypes.map(bt => (
                                <div key={bt.key} onClick={() => setProjectBetType(bt.key)}
                                  style={{
                                    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                                    border: '1px solid ' + (projectBetType === bt.key ? '#E63946' : 'rgba(255,255,255,0.06)'),
                                    background: projectBetType === bt.key ? 'rgba(230,57,70,0.1)' : 'rgba(255,255,255,0.02)',
                                    transition: 'all 0.15s',
                                  }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{bt.label}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#E63946' }}>x{getProjectOdds(score, bt.key)}</span>
                                  </div>
                                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{bt.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* FEATURED BET */}
          <div style={{ position: isMobile ? 'static' : 'sticky', top: '80px', height: 'fit-content' }}>
            <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 0 40px rgba(230,57,70,0.1)' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.2), transparent)', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>🎯 Featured Bet</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
                    overflow: 'hidden', border: '2px solid ' + (categoryColors[selectedRapper.category] ?? '#E63946'),
                    background: (categoryColors[selectedRapper.category] ?? '#E63946') + '33',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px ' + (categoryColors[selectedRapper.category] ?? '#E63946') + '66',
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
                <div style={{ padding: '14px', borderRadius: '12px', marginBottom: '20px', background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Type de pari</p>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>{betLabel}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Cote</p>
                    <p style={{ fontSize: '24px', fontWeight: 900, color: '#E63946' }}>x{multiplier}</p>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Score</p>
                    <p style={{ fontSize: '24px', fontWeight: 900, color: '#00ff87' }}>{selectedRapper.activity_score}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {[100, 200, 500, 1000].map(a => (
                    <button key={a} onClick={() => setAmount(a)} style={{
                      flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 700,
                      background: amount === a ? '#E63946' : 'rgba(255,255,255,0.06)',
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
                  background: loading ? 'rgba(230,57,70,0.4)' : 'linear-gradient(135deg, #E63946, #C1121F)',
                  color: 'white', boxShadow: '0 4px 30px rgba(230,57,70,0.4)',
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