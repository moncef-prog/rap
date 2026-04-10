'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ACCENT = '#ff6b00'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false) // session récupérée depuis le token URL

  useEffect(() => {
    // Supabase parse automatiquement le token dans le hash de l'URL
    // et émet l'événement PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Mot de passe mis à jour ! Redirection...')
      setTimeout(() => router.push('/'), 2000)
    }
    setLoading(false)
  }

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
            Nouveau mot de passe
          </p>
        </div>

        {!ready ? (
          /* En attente que Supabase valide le token depuis le lien email */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              Validation du lien en cours...
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '8px' }}>
              Si rien ne se passe,{' '}
              <a href="/auth" style={{ color: ACCENT }}>refais une demande</a>.
            </p>
          </div>
        ) : success ? (
          <div style={{
            padding: '16px', borderRadius: '12px', textAlign: 'center',
            background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.25)',
            color: '#00ff87', fontSize: '14px', lineHeight: 1.6,
          }}>
            ✅ {success}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <input
                placeholder="Nouveau mot de passe"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Confirme le mot de passe"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 14px', borderRadius: '10px', marginBottom: '14px',
                background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
                color: '#ff4444', fontSize: '13px', textAlign: 'center',
              }}>{error}</div>
            )}

            <button
              onClick={handleReset}
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
              {loading ? '...' : 'Mettre à jour le mot de passe'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
