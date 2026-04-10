'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Navbar() {
  const [showModal, setShowModal] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchBalance(data.user.id)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBalance(session.user.id)
    })
  }, [])

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('balance').eq('id', userId).single()
    if (data) setBalance(data.balance)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else setShowModal(false)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) await supabase.from('profiles').insert({ id: data.user.id, username, balance: 1000 })
      setShowModal(false)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setBalance(null)
    setMenuOpen(false)
  }

  const links = [
    { label: 'Carte', href: '/' },
    { label: 'Paris', href: '/bets' },
    { label: 'League', href: '/fantasy' },
    { label: 'Profil', href: '/profile' },
    { label: 'Messages', href: '/messages' },
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
        background: 'rgba(6,6,6,0.98)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        zIndex: 1000, boxShadow: '0 1px 0 rgba(230,57,70,0.15)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', marginRight: 'auto' }}>
          <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: 'white' }}>
            9ri9i<span style={{ color: '#CC0000' }}>BET</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '2px', marginRight: '16px' }}>
          {links.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.label} href={item.href} style={{
                padding: '7px 14px', borderRadius: '8px',
                color: active ? 'white' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                background: active ? 'rgba(230,57,70,0.12)' : 'transparent',
                borderBottom: active ? '2px solid #E63946' : '2px solid transparent',
              }}>{item.label}</Link>
            )
          })}
        </div>

        {/* Balance */}
        {user && balance !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', marginRight: '10px',
          }}>
            <span style={{ fontSize: '13px' }}>💊</span>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'white' }}>{balance.toLocaleString()}</span>
          </div>
        )}

        {/* Desktop auth */}
        <div className="desktop-nav">
          {user ? (
            <button onClick={handleLogout} style={{
              padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px',
            }}>Déconnexion</button>
          ) : (
            <button onClick={() => setShowModal(true)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: '#E63946', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            }}>Se connecter</button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-nav" onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white',
          width: 36, height: 36, borderRadius: '8px', cursor: 'pointer', fontSize: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-nav" style={{
          position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0,
          background: 'rgba(6,6,6,0.98)', zIndex: 999, padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          {links.map(item => (
            <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{
              padding: '16px 20px', borderRadius: '12px',
              color: pathname === item.href ? 'white' : 'rgba(255,255,255,0.6)',
              textDecoration: 'none', fontSize: '16px', fontWeight: 700,
              background: pathname === item.href ? 'rgba(230,57,70,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${pathname === item.href ? 'rgba(230,57,70,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}>{item.label}</Link>
          ))}

          <div style={{ marginTop: 'auto' }}>
            {user ? (
              <button onClick={handleLogout} style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '15px', fontWeight: 600,
              }}>Déconnexion</button>
            ) : (
              <button onClick={() => { setShowModal(true); setMenuOpen(false) }} style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: '#E63946', color: 'white', cursor: 'pointer', fontSize: '15px', fontWeight: 700,
              }}>Se connecter</button>
            )}
          </div>
        </div>
      )}

      {/* Modal auth */}
      {showModal && (
        <div onClick={(e) => e.target === e.currentTarget && setShowModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            width: '100%', maxWidth: '400px', background: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '6px' }}>
                9ri9i<span style={{ color: '#E63946' }}>BET</span>
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                {isLogin ? 'Connecte-toi pour parier' : '1000 💊 Rivo offerts à l\'inscription'}
              </p>
            </div>

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
              {['Connexion', 'Inscription'].map((tab, i) => (
                <button key={tab} onClick={() => setIsLogin(i === 0)} style={{
                  flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 700,
                  background: isLogin === (i === 0) ? '#E63946' : 'transparent',
                  color: isLogin === (i === 0) ? 'white' : 'rgba(255,255,255,0.4)',
                }}>{tab}</button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {!isLogin && (
                <input placeholder="Ton pseudo" value={username} onChange={e => setUsername(e.target.value)}
                  style={{ padding: '13px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none' }} />
              )}
              <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ padding: '13px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none' }} />
              <input placeholder="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{ padding: '13px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none' }} />
            </div>

            {error && <p style={{ color: '#E63946', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
              background: '#E63946', color: 'white', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
            }}>
              {loading ? '...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
      `}</style>
    </>
  )
}