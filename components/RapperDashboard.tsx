'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@supabase/supabase-js'
import { useIsMobile } from '@/lib/useIsMobile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Rapper {
  id: string
  name: string
  slug: string
  city: string
  neighborhood: string
  short_bio: string
  category: string
  activity_score: number
  active_since: number
  social_links: Record<string, string>
  profile_image_url?: string
}

interface Bet {
  id: string
  amount: number
  multiplier: number
  status: string
  created_at: string
}

interface Props {
  rapper: Rapper
  bets: Bet[]
}

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87',
  mainstream: '#E63946',
  old_school: '#3b82f6',
  underground: '#a855f7',
}

function generateChartData(score: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i],
    score: Math.max(10, score - 30 + Math.floor(Math.random() * 40) + i * 2),
  }))
}

export default function RapperDashboard({ rapper, bets: initialBets }: Props) {
  const [betAmount, setBetAmount] = useState(100)
  const [bets, setBets] = useState(initialBets)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const isMobile = useIsMobile()
  const color = categoryColors[rapper.category] ?? '#E63946'
  const chartData = generateChartData(rapper.activity_score)
  const multiplier = (rapper.activity_score / 100 + 0.8).toFixed(1)
  const totalBets = bets.reduce((acc, b) => acc + b.amount, 0)

  const placeBet = async () => {
    setLoading(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('❌ Connecte-toi pour parier'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (!profile || profile.balance < betAmount) {
      setMessage('❌ Balance insuffisante')
      setLoading(false)
      return
    }

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - betAmount })
      .eq('id', user.id)

    if (balanceError) { setMessage('❌ Erreur'); setLoading(false); return }

    const { data: newBet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: user.id,
        rapper_id: rapper.id,
        amount: betAmount,
        multiplier: Number(multiplier),
        status: 'active',
      })
      .select()
      .single()

    if (betError) { setMessage('❌ Erreur pari'); setLoading(false); return }

    setBets([...bets, newBet])
    setMessage('✅ Pari placé ! -' + betAmount + ' Rivo')
    setLoading(false)
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060606',
      color: 'white',
      paddingTop: '60px',
      fontFamily: 'Inter, sans-serif',
      overflowY: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, ' + color + '15 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '20px 16px' : '40px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '16px' : '32px',
      }}>
        {/* Boutons navigation */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href={`/back/`} style={{
            color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px',
            padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
          }}>← Retour</a>
          <a href={`/back/${rapper.slug}`} style={{
              padding: '8px 16px', borderRadius: '10px',
              background: '#E63946', border: 'none',
              color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>🔥 BACK</a>
          <a href={`/community/${rapper.slug}`} style={{
            padding: '8px 16px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>👥 Communauté</a>
        </div>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{
            width: '100px', height: '100px', borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            border: '3px solid ' + color,
            boxShadow: '0 0 40px ' + color + '66',
            background: color + '33',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {rapper.profile_image_url
            ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 48 }}>🎤</span>
          }
        </motion.div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '42px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-1px' }}
          >{rapper.name}</motion.h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', marginBottom: '12px' }}>
            📍 {rapper.city} — {rapper.neighborhood}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{
              padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', background: color + '22', color: color, border: '1px solid ' + color + '44',
            }}>{rapper.category.replace('_', ' ')}</span>
            {rapper.active_since && (
              <span style={{
                padding: '4px 14px', borderRadius: '20px', fontSize: '12px',
                color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)',
              }}>Depuis {rapper.active_since}</span>
            )}
          </div>
        </div>

        <div style={{ marginLeft: isMobile ? 0 : 'auto', textAlign: isMobile ? 'left' : 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: '64px', fontWeight: 900, color: color, lineHeight: 1, textShadow: '0 0 40px ' + color + '88' }}
          >{rapper.activity_score}</motion.div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Score d'activité</p>
        </div>
      </div>

      <div style={{ padding: isMobile ? '16px' : '40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Biographie</h3>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)' }}>{rapper.short_bio}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Évolution du score</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f0f19', border: '1px solid ' + color + '44', borderRadius: '8px', color: 'white' }} />
                <Area type="monotone" dataKey="score" stroke={color} strokeWidth={2} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Total misé', value: totalBets + ' 💊', color: '#E63946' },
              { label: 'Paris actifs', value: bets.filter(b => b.status === 'active').length.toString(), color: '#00ff87' },
              { label: 'Cote actuelle', value: 'x' + multiplier, color: color },
            ].map((stat) => (
              <div key={stat.label} style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '28px', fontWeight: 800, color: stat.color, marginBottom: '6px' }}>{stat.value}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(15,15,25,0.95)', border: '1px solid ' + color + '33',
            borderRadius: '24px', padding: isMobile ? '20px 16px' : '28px', height: 'fit-content',
            position: isMobile ? 'static' : 'sticky', top: '80px', boxShadow: '0 0 40px ' + color + '10',
          }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>🔥 Parier sur {rapper.name}</h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>Mise ta balance et multiplie tes gains</p>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px', background: color + '15', borderRadius: '14px',
            border: '1px solid ' + color + '33', marginBottom: '20px',
          }}>
            <div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Cote actuelle</p>
              <p style={{ fontSize: '32px', fontWeight: 900, color: color }}>x{multiplier}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Score</p>
              <p style={{ fontSize: '24px', fontWeight: 800 }}>{rapper.activity_score}</p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Montant de la mise</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {[50, 100, 200, 500].map(amount => (
              <button key={amount} onClick={() => setBetAmount(amount)} style={{
                flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700, transition: 'all 0.2s',
                background: betAmount === amount ? color : 'rgba(255,255,255,0.06)',
                color: betAmount === amount ? 'white' : 'rgba(255,255,255,0.6)',
                boxShadow: betAmount === amount ? '0 0 15px ' + color + '66' : 'none',
              }}>
                {amount} 💊
              </button>
            ))}
          </div>

          <input type="number" value={betAmount} onChange={e => setBetAmount(Number(e.target.value))}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
              color: 'white', fontSize: '16px', fontWeight: 700, outline: 'none',
              marginBottom: '16px', boxSizing: 'border-box',
            }}
          />

          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '14px 16px',
            background: 'rgba(0,255,135,0.08)', borderRadius: '12px',
            border: '1px solid rgba(0,255,135,0.2)', marginBottom: '20px',
          }}>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Gain potentiel</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#00ff87' }}>
              {Math.round(betAmount * Number(multiplier))} 💊
            </span>
          </div>

          {message && (
            <div style={{
              padding: '12px', borderRadius: '10px', marginBottom: '12px', textAlign: 'center',
              background: message.includes('✅') ? 'rgba(0,255,135,0.1)' : 'rgba(255,68,68,0.1)',
              border: '1px solid ' + (message.includes('✅') ? 'rgba(0,255,135,0.3)' : 'rgba(255,68,68,0.3)'),
              fontSize: '14px', fontWeight: 600,
              color: message.includes('✅') ? '#00ff87' : '#ff4444',
            }}>{message}</div>
          )}

          <button onClick={placeBet} disabled={loading} style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 800,
            background: loading ? 'rgba(230,57,70,0.4)' : 'linear-gradient(135deg, #E63946, #C1121F)',
            color: 'white', boxShadow: '0 4px 30px rgba(230,57,70,0.44)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? 'En cours...' : 'PLACER LE PARI 🔥'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>
            Monnaie fictive — aucune valeur réelle
          </p>
        </motion.div>
      </div>
    </div>
  )
}