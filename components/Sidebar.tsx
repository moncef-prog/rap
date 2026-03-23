'use client'
import { Rapper } from '@/types'
import { useState } from 'react'


interface SidebarProps {
  rappers: Rapper[]
  onSelectRapper: (rapper: Rapper) => void
  selectedRapper: Rapper | null
}

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87',
  mainstream: '#E63946',
  old_school: '#3b82f6',
  underground: '#a855f7',
}

const categoryLabels: Record<string, string> = {
  new_gen: 'New Gen',
  mainstream: 'Mainstream',
  old_school: 'Old School',
  underground: 'Underground',
}

export default function Sidebar({ rappers, onSelectRapper, selectedRapper }: SidebarProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const filtered = rappers
    .filter(r => activeFilter ? r.category === activeFilter : true)
    .filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.activity_score - a.activity_score)

  return (
    <div style={{
      position: 'fixed',
      top: '60px', left: 0,
      width: '340px',
      height: 'calc(100vh - 60px)',
      background: 'rgba(10,10,15,0.97)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      overflowY: 'auto',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
          🎯 Radar
        </h2>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{filtered.length} artistes</span>
      </div>

      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>🔍</span>
        <input
          placeholder="Recherche..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '9px 12px 9px 32px',
            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: 'white',
            fontSize: '13px', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
            width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', fontSize: '10px',
          }}>✕</button>
        )}
      </div>

      {/* Filtres catégories */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button onClick={() => setActiveFilter(null)} style={{
          padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
          fontSize: '11px', fontWeight: 700,
          background: !activeFilter ? 'rgba(230,57,70,0.8)' : 'rgba(255,255,255,0.06)',
          color: !activeFilter ? 'white' : 'rgba(255,255,255,0.4)',
        }}>Tous</button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button key={key} onClick={() => setActiveFilter(activeFilter === key ? null : key)} style={{
            padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            fontSize: '11px', fontWeight: 700,
            background: activeFilter === key ? categoryColors[key] + 'cc' : 'rgba(255,255,255,0.06)',
            color: activeFilter === key ? 'white' : 'rgba(255,255,255,0.4)',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '12px' }} />

      {/* Liste rappeurs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Aucun résultat</p>
        ) : (
          filtered.map((rapper) => {
            const color = categoryColors[rapper.category] ?? '#E63946'
            const isSelected = selectedRapper?.id === rapper.id
            return (
              <div key={rapper.id} onClick={() => onSelectRapper(rapper)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  background: isSelected ? color + '15' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid ' + color + '44' : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(230,57,70,0.08)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              >
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  overflow: 'hidden', border: '2px solid ' + color,
                  background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isSelected ? '0 0 12px ' + color + '88' : 'none',
                }}>
                  {rapper.profile_image_url
                    ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 16, fontWeight: 800, color }}>{rapper.name[0]}</span>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? color : 'white' }}>
                    {rapper.name}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>📍 {rapper.city}</p>
                </div>

                <div style={{
                  fontSize: '11px', fontWeight: 700, color: color,
                  background: color + '15', padding: '2px 8px', borderRadius: '20px',
                }}>
                  {rapper.activity_score}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
