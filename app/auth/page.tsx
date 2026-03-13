'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/')
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      // Créer le profil avec 1000 Dyal
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          balance: 1000,
        })
      }
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08080c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: '400px',
        background: 'rgba(15,15,25,0.95)',
        border: '1px solid rgba(255,107,0,0.2)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 0 60px rgba(255,107,0,0.1)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
            🎤 RAP MAP <span style={{ color: '#ff6b00' }}>MOROCCO</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {isLogin ? 'Connecte-toi pour parier' : 'Crée ton compte — 1000 🪙 offerts'}
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
        }}>
          {['Connexion', 'Inscription'].map((tab, i) => (
            <button key={tab} onClick={() => setIsLogin(i === 0)} style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
              background: isLogin === (i === 0) ? '#ff6b00' : 'transparent',
              color: isLogin === (i === 0) ? 'white' : 'rgba(255,255,255,0.4)',
            }}>{tab}</button>
          ))}
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {!isLogin && (
            <input
              placeholder="Ton pseudo"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <input
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            background: loading ? 'rgba(255,107,0,0.4)' : 'linear-gradient(135deg, #ff6b00, #ff9500)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(255,107,0,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          En continuant tu acceptes les conditions d'utilisation
        </p>
      </div>
    </div>
  )
}