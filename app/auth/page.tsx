'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type View = 'login' | 'register' | 'forgot'

const ACCENT = '#ff6b00'

export default function AuthPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/')

    } else if (view === 'register') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, username, balance: 1000 })
      }
      router.push('/')

    } else {
      // forgot password
      const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Email envoyé ! Vérifie ta boîte mail pour réinitialiser ton mot de passe.')
        setEmail('')
      }
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08080c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(15,15,25,0.95)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: '24px',
        padding: '40px',
        boxShadow: `0 0 60px ${ACCENT}18`,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px', color: 'white' }}>
            🎤 RAP MAP <span style={{ color: ACCENT }}>MOROCCO</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {view === 'login' && 'Connecte-toi pour parier'}
            {view === 'register' && 'Crée ton compte — 1000 🪙 offerts'}
            {view === 'forgot' && 'Réinitialise ton mot de passe'}
          </p>
        </div>

        {/* Toggle Connexion / Inscription — caché sur forgot */}
        {view !== 'forgot' && (
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
          }}>
            {(['login', 'register'] as const).map((v, i) => (
              <button key={v} onClick={() => { setView(v); setError(''); setSuccess('') }} style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
                background: view === v ? ACCENT : 'transparent',
                color: view === v ? 'white' : 'rgba(255,255,255,0.4)',
              }}>{i === 0 ? 'Connexion' : 'Inscription'}</button>
            ))}
          </div>
        )}

        {/* Bouton retour — vue forgot */}
        {view === 'forgot' && (
          <button
            onClick={() => { setView('login'); setError(''); setSuccess('') }}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
              fontSize: '13px', cursor: 'pointer', padding: '0 0 20px 0',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >← Retour à la connexion</button>
        )}

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
          {view === 'register' && (
            <input
              placeholder="Ton pseudo"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />
          {view !== 'forgot' && (
            <input
              placeholder="Mot de passe"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
            />
          )}
        </div>

        {/* Lien mot de passe oublié — visible uniquement en mode login */}
        {view === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: '20px', marginTop: '6px' }}>
            <button
              onClick={() => { setView('forgot'); setError(''); setSuccess('') }}
              style={{
                background: 'none', border: 'none',
                color: ACCENT, fontSize: '12px',
                cursor: 'pointer', padding: 0,
                textDecoration: 'underline',
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {view !== 'login' && <div style={{ marginBottom: '20px' }} />}

        {/* Messages erreur / succès */}
        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '10px', marginBottom: '14px',
            background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
            color: '#ff4444', fontSize: '13px', textAlign: 'center',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            padding: '12px 14px', borderRadius: '10px', marginBottom: '14px',
            background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.25)',
            color: '#00ff87', fontSize: '13px', textAlign: 'center', lineHeight: 1.5,
          }}>{success}</div>
        )}

        {/* Bouton principal */}
        {!success && (
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
              background: loading ? `${ACCENT}66` : `linear-gradient(135deg, ${ACCENT}, #ff9500)`,
              color: 'white',
              boxShadow: `0 4px 20px ${ACCENT}44`,
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? '...'
              : view === 'login'
                ? 'Se connecter'
                : view === 'register'
                  ? 'Créer mon compte'
                  : 'Envoyer le lien'}
          </button>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
          En continuant tu acceptes les conditions d'utilisation
        </p>
      </div>
    </div>
  )
}
