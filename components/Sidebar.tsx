'use client'

interface Rapper {
  id: string
  name: string
  city: string
  neighborhood: string
  short_bio: string
  category: string
  activity_score: number
}

interface SidebarProps {
  rappers: Rapper[]
}

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87',
  mainstream: '#c8922a',
  old_school: '#3b82f6',
  underground: '#a855f7',
}

export default function Sidebar({ rappers }: SidebarProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '60px',
      left: 0,
      width: '280px',
      height: 'calc(100vh - 60px)',
      background: 'rgba(10, 10, 15, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      overflowY: 'auto',
    }}>

      {/* Titre */}
      <h2 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', textTransform: 'uppercase' }}>
        Top Artists
      </h2>

      {/* Filtres */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'Rappers', color: '#c8922a', active: true },
          { label: 'Studios', color: '#3b82f6', active: true },
          { label: 'Video Spots', color: '#ff3b3b', active: false },
        ].map((filter) => (
          <div key={filter.label} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: filter.color }} />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{filter.label}</span>
            </div>
            <div style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px',
              background: filter.active ? filter.color : 'rgba(255,255,255,0.1)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute',
                top: '3px',
                left: filter.active ? '19px' : '3px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '16px' }} />

      {/* Liste rappeurs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rappers.map((rapper) => (
          <div key={rapper.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,146,42,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          >
            {/* Avatar */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: categoryColors[rapper.category] ?? '#c8922a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px',
              color: '#0a0a0f',
              flexShrink: 0,
            }}>
              {rapper.name.charAt(0)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rapper.name}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                📍 {rapper.city}
              </p>
            </div>

            {/* Score */}
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#c8922a',
              background: 'rgba(200,146,42,0.1)',
              padding: '2px 8px',
              borderRadius: '20px',
            }}>
              {rapper.activity_score}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}