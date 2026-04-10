'use client'
import { Rapper } from '@/types'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from './Sidebar'
import { useIsMobile } from '@/lib/useIsMobile'

const Map = dynamic(() => import('./Map'), { ssr: false })

export default function AppShell({ rappers }: { rappers: Rapper[] }) {
  const [selectedRapper, setSelectedRapper] = useState<Rapper | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleSelectRapper = (rapper: Rapper) => {
    setSelectedRapper(rapper)
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Sidebar
        rappers={rappers}
        onSelectRapper={handleSelectRapper}
        selectedRapper={selectedRapper}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 850,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Carte — pleine largeur sur mobile */}
      <div style={{ marginLeft: isMobile ? 0 : '340px', height: '100%' }}>
        <Map
          rappers={rappers}
          selectedRapper={selectedRapper}
          onSelectRapper={setSelectedRapper}
        />
      </div>

      {/* Bouton FAB mobile pour ouvrir la sidebar */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', left: '24px', zIndex: 1000,
            width: '54px', height: '54px', borderRadius: '50%',
            background: '#E63946', border: 'none', cursor: 'pointer',
            fontSize: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(230,57,70,0.55)',
          }}
          aria-label="Ouvrir la liste des rappeurs"
        >
          🎯
        </button>
      )}
    </main>
  )
}
