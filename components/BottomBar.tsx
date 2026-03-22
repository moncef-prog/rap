'use client'

import { useState } from 'react'

interface Rapper {
  id: string
  name: string
  city: string
  neighborhood: string
  latitude: number
  longitude: number
  short_bio: string
  category: string
  activity_score: number
  social_links: Record<string, string>
}

interface BottomBarProps {
  rappers: Rapper[]
  onSelectRapper: (rapper: Rapper) => void
}

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87',
  mainstream: '#ff6b00',
  old_school: '#3b82f6',
  underground: '#a855f7',
}

const cities = ['Tous', 'Casablanca', 'Tanger', 'Rabat', 'Oujda', 'Laâyoune', 'Marrakech']

export default function BottomBar({ rappers, onSelectRapper }: BottomBarProps) {
  const [activeCity, setActiveCity] = useState('Tous')

  const filtered = activeCity === 'Tous'
    ? rappers
    : rappers.filter(r => r.city === activeCity)

  const sorted = [...filtered].sort((a, b) => b.activity_score - a.activity_score)

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 800,
      background: 'linear-gradient(to top, rgba(8,8,12,0.98) 60%, transparent)',
      padding: '12px 24px 20px',
    }}>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {cities.map(city => (
          <button key={city} onClick={() => setActiveCity(city)} style={{
            padding: '5px 14px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            background: activeCity === city ? '#ff6b00' : 'rgba(255,255,255,0.07)',
            color: activeCity === city ? 'white' : 'rgba(255,255,255,0.5)',
            boxShadow: activeCity === city ? '0 0 15px rgba(255,107,0,0.4)' : 'none',
          }}>
            {city}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {sorted.map((rapper, i) => {
          const color = categoryColors[rapper.category] ?? '#ff6b00'
          return (
            <div
              key={rapper.id}
              onClick={() => onSelectRapper(rapper)}
              style={{
                flexShrink: 0,
                width: '160px',
                background: 'rgba(15,15,25,0.95)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = '1px solid ' + color + '66'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px ' + color + '33'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {i < 3 && (
                <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '14px' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
              )}

              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, ' + color + ' 0%, ' + color + '44 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '10px',
                boxShadow: '0 0 15px ' + color + '66',
              }}>🎤</div>

              <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rapper.name}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                {rapper.neighborhood}
              </p>

              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: rapper.activity_score + '%',
                  height: '100%',
                  background: 'linear-gradient(90deg, ' + color + ', #ffaa00)',
                  borderRadius: '2px',
                }} />
              </div>
              <p style={{ fontSize: '10px', color: color, fontWeight: 700, marginTop: '4px' }}>
                Score {rapper.activity_score}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}