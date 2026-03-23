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
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, username, balance: 1000 })
      }
      setShowModal(false)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setBalance(null)
  }

  const links = [
    { label: 'Carte', href: '/' },
    { label: 'Rappers', href: '/bets' },
    { label: 'league ', href: '/fantasy' },
    { label: 'Profil', href: '/profile' },
    { label: 'Messages', href: '/messages' },
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
        background: 'rgba(8,8,12,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 1000, gap: '32px',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎤</span>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'white', letterSpacing: '-0.5px' }}>
           9ri9i<span style={{ color: '#E63946' }}>BET</span>
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '24px', marginLeft: '16px' }}>
          {links.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.label} href={item.href} style={{
                color: active ? 'white' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                background: active ? 'rgba(230,57,70,0.12)' : 'transparent',
                borderBottom: active ? '2px solid #E63946' : '2px solid transparent',
                paddingBottom: '2px', transition: 'color 0.2s',
              }}>{item.label}</Link>
            )
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && balance !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
              background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '20px',
            }}>
              <span style={{ fontSize: '16px' }}>💊</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#ff6b00' }}>{balance} Rivo</span>
            </div>
          )}
          {user ? (
            <button onClick={handleLogout} style={{
              padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px',
            }}>Déconnexion</button>
          ) : (
            <button onClick={() => setShowModal(true)} style={{
              padding: '8px 20px', borderRadius: '20px', border: 'none',
              background: 'linear-gradient(135deg, #ff6b00, #ff9500)', color: 'white',
              cursor: 'pointer', fontSize: '13px', fontWeight: 700, boxShadow: '0 0 20px rgba(255,107,0,0.3)',
            }}>Se connecter</button>
          )}
        </div>
      </nav>

      {showModal && (
        <div onClick={(e) => e.target === e.currentTarget && setShowModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '400px', background: 'rgba(15,15,25,0.98)', border: '1px solid rgba(255,107,0,0.2)',
            borderRadius: '24px', padding: '40px', boxShadow: '0 0 60px rgba(255,107,0,0.15)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
                🏆 9ri9i<span style={{ color: '#E63946' }}>BET</span> League
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                {isLogin ? 'Connecte-toi pour parier' : 'Crée ton compte — 1000 💊 Rivo offerts'}
              </p>
            </div>

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
              {['Connexion', 'Inscription'].map((tab, i) => (
                <button key={tab} onClick={() => setIsLogin(i === 0)} style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600,
                  background: isLogin === (i === 0) ? '#ff6b00' : 'transparent',
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

            {error && <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontSize: '15px', fontWeight: 700, background: 'linear-gradient(135deg, #ff6b00, #ff9500)',
              color: 'white', boxShadow: '0 4px 20px rgba(255,107,0,0.3)',
            }}>
              {loading ? '...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}