'use client'
import { Rapper } from '@/types'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from './Sidebar'

const Map = dynamic(() => import('./Map'), { ssr: false })


export default function AppShell({ rappers }: { rappers: Rapper[] }) {
  const [selectedRapper, setSelectedRapper] = useState<Rapper | null>(null)

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Sidebar
        rappers={rappers}
        onSelectRapper={setSelectedRapper}
        selectedRapper={selectedRapper}
      />
      <div style={{ marginLeft: '340px', height: '100%' }}>
        <Map
          rappers={rappers}
          selectedRapper={selectedRapper}
          onSelectRapper={setSelectedRapper}
        />
      </div>
    </main>
  )
}