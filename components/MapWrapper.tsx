'use client'

import { useState } from 'react'
import Map from './Map'
import Sidebar from './Sidebar'
import BottomBar from './BottomBar'

interface Rapper {
  id: string
  name: string
  slug: string
  city: string
  neighborhood: string
  latitude: number
  longitude: number
  short_bio: string
  category: string
  activity_score: number
  social_links: Record<string, string>
}

export default function MapWrapper({ rappers }: { rappers: Rapper[] }) {
  const [, setSelectedRapper] = useState<Rapper | null>(null)

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Sidebar rappers={rappers} onSelectRapper={function (rapper: Rapper): void {
              throw new Error('Function not implemented.')
          } } selectedRapper={null} />
      <div style={{ marginLeft: '280px', height: '100%', position: 'relative' }}>
        <Map rappers={rappers} />
        <BottomBar
          rappers={rappers}
          onSelectRapper={(rapper) => setSelectedRapper(rapper)}
        />
      </div>
    </main>
  )
}