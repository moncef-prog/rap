'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from './Sidebar'

const Map = dynamic(() => import('./Map'), { ssr: false })

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

export default function AppShell({ rappers }: { rappers: Rapper[] }) {
  const [selectedRapper, setSelectedRapper] = useState<Rapper | null>(null)

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Sidebar
        rappers={rappers}
        onSelectRapper={setSelectedRapper}
        selectedRapper={selectedRapper}
      />
      <div style={{ marginLeft: '280px', height: '100%' }}>
        <Map
          rappers={rappers}
          selectedRapper={selectedRapper}
          onSelectRapper={setSelectedRapper}
        />
      </div>
    </main>
  )
}