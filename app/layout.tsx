import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Rap Map Morocco',
  description: 'La carte interactive du rap marocain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <div style={{ paddingTop: '60px', height: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}