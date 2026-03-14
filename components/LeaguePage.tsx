'use client'

import { useState, useEffect } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function LeaguePage() {
  const [user, setUser] = useState<any>(null)
  const [myLeagues, setMyLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'mes-ligues' | 'creer' | 'rejoindre'>('mes-ligues')

  // Créer ligue
  const [leagueName, setLeagueName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')

  // Rejoindre ligue
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinMsg, setJoinMsg] = useState('')

  // Membres ligue sélectionnée
  const [selectedLeague, setSelectedLeague] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        loadMyLeagues(data.user.id)
      }
      setLoading(false)
    })
  }, [])

  const loadMyLeagues = async (userId: string) => {
    const { data } = await supabase
      .from('league_members')
      .select('*, leagues(*, profiles(username))')
      .eq('user_id', userId)
    setMyLeagues(data ?? [])
  }

  const loadMembers = async (leagueId: string) => {
    const { data } = await supabase
      .from('league_members')
      .select('*, profiles(username, balance), fantasy_teams(total_points)')
      .eq('league_id', leagueId)
    setMembers(data ?? [])
  }

  const createLeague = async () => {
    if (!leagueName.trim()) return
    setCreating(true)
    const code = generateCode()
    const { data, error } = await supabase.from('leagues').insert({
      name: leagueName, code, creator_id: user.id,
    }).select().single()

    if (error) { setCreateMsg('❌ Erreur'); setCreating(false); return }

    await supabase.from('league_members').insert({ league_id: data.id, user_id: user.id })
    setCreateMsg('✅ Ligue créée ! Code : ' + code)
    setLeagueName('')
    loadMyLeagues(user.id)
    setCreating(false)
  }

  const joinLeague = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    const { data: league, error } = await supabase
      .from('leagues').select('*').eq('code', joinCode.toUpperCase()).single()

    if (error || !league) { setJoinMsg('❌ Code invalide'); setJoining(false); return }

    const { error: joinError } = await supabase
      .from('league_members').insert({ league_id: league.id, user_id: user.id })

    if (joinError) { setJoinMsg('❌ Déjà membre ou erreur'); setJoining(false); return }

    setJoinMsg('✅ Rejoint la ligue ' + league.name + ' !')
    setJoinCode('')
    loadMyLeagues(user.id)
    setJoining(false)
  }

  const openLeague = async (league: any) => {
    setSelectedLeague(league)
    await loadMembers(league.id)
  }

  if (loading) return null

  if (!user) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
      Connecte-toi pour accéder aux ligues
    </div>
  )

  if (selectedLeague) return (
    <div>
      <button onClick={() => setSelectedLeague(null)} style={{
        background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white',
        padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', marginBottom: '20px', fontSize: '13px',
      }}>← Retour</button>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>🏆 {selectedLeague.name}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Code d'invitation :</span>
          <span style={{
            fontFamily: 'monospace', fontWeight: 800, fontSize: '16px', letterSpacing: '3px',
            color: '#ff6b00', background: 'rgba(255,107,0,0.1)', padding: '4px 12px', borderRadius: '8px',
            border: '1px solid rgba(255,107,0,0.3)',
          }}>{selectedLeague.code}</span>
          <button onClick={() => navigator.clipboard.writeText(selectedLeague.code)} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white',
            padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
          }}>📋 Copier</button>
        </div>
      </div>

      {/* Classement membres */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>👥 Classement — {members.length} membres</h3>
        </div>
        {members
          .sort((a, b) => (b.fantasy_teams?.total_points ?? 0) - (a.fantasy_teams?.total_points ?? 0))
          .map((member, i) => {
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={member.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 20px',
                borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: member.user_id === user.id ? 'rgba(255,107,0,0.05)' : 'transparent',
              }}>
                <span style={{ fontSize: '20px', width: 28, textAlign: 'center' }}>
                  {medals[i] ?? <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>#{i + 1}</span>}
                </span>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff6b00, #ff9500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, flexShrink: 0,
                }}>
                  {member.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '14px' }}>
                    {member.profiles?.username}
                    {member.user_id === user.id && <span style={{ marginLeft: 8, fontSize: '11px', color: '#ff6b00' }}>(toi)</span>}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>💊 {member.profiles?.balance?.toLocaleString()} Rivo</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 900, fontSize: '18px', color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'white' }}>
                    {member.fantasy_teams?.total_points ?? 0} pts
                  </p>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'mes-ligues', label: '🏆 Mes Ligues' },
          { key: 'creer', label: '➕ Créer' },
          { key: 'rejoindre', label: '🔗 Rejoindre' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600,
            background: tab === t.key ? '#ff6b00' : 'transparent',
            color: tab === t.key ? 'white' : 'rgba(255,255,255,0.4)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Mes ligues */}
      {tab === 'mes-ligues' && (
        <div>
          {myLeagues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.3)' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</p>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucune ligue pour l'instant</p>
              <p style={{ fontSize: '13px' }}>Crée ou rejoins une ligue pour jouer avec tes amis</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {myLeagues.map(member => {
                const league = member.leagues
                return (
                  <div key={member.id} onClick={() => openLeague(league)}
                    style={{
                      padding: '20px', borderRadius: '16px', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{league.name}</h3>
                      {league.creator_id === user.id && (
                        <span style={{ fontSize: '10px', color: '#ff6b00', background: 'rgba(255,107,0,0.1)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(255,107,0,0.2)' }}>Admin</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ff6b00', fontSize: '14px', letterSpacing: '2px' }}>{league.code}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>Voir le classement →</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Créer */}
      {tab === 'creer' && (
        <div style={{ maxWidth: '400px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Créer une ligue</h3>
          <input placeholder="Nom de la ligue (ex: Les Bro du Bled)" value={leagueName}
            onChange={e => setLeagueName(e.target.value)}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          {createMsg && (
            <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '12px', textAlign: 'center', background: createMsg.includes('✅') ? 'rgba(0,255,135,0.1)' : 'rgba(255,68,68,0.1)', color: createMsg.includes('✅') ? '#00ff87' : '#ff4444', fontSize: '14px', fontWeight: 600 }}>{createMsg}</div>
          )}
          <button onClick={createLeague} disabled={creating || !leagueName.trim()} style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: leagueName.trim() ? 'linear-gradient(135deg, #ff6b00, #ff9500)' : 'rgba(255,255,255,0.05)',
            color: 'white', fontWeight: 800, fontSize: '15px', cursor: leagueName.trim() ? 'pointer' : 'not-allowed',
          }}>
            {creating ? 'Création...' : '🏆 Créer la ligue'}
          </button>
        </div>
      )}

      {/* Rejoindre */}
      {tab === 'rejoindre' && (
        <div style={{ maxWidth: '400px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Rejoindre une ligue</h3>
          <input placeholder="Code de la ligue (ex: ABC123)" value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '16px', fontWeight: 800, letterSpacing: '3px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', textTransform: 'uppercase' }}
          />
          {joinMsg && (
            <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '12px', textAlign: 'center', background: joinMsg.includes('✅') ? 'rgba(0,255,135,0.1)' : 'rgba(255,68,68,0.1)', color: joinMsg.includes('✅') ? '#00ff87' : '#ff4444', fontSize: '14px', fontWeight: 600 }}>{joinMsg}</div>
          )}
          <button onClick={joinLeague} disabled={joining || !joinCode.trim()} style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: joinCode.trim() ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255,255,255,0.05)',
            color: 'white', fontWeight: 800, fontSize: '15px', cursor: joinCode.trim() ? 'pointer' : 'not-allowed',
          }}>
            {joining ? 'Recherche...' : '🔗 Rejoindre'}
          </button>
        </div>
      )}
    </div>
  )
}