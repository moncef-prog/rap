'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

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
  profile_image_url?: string
}

interface MapProps {
  rappers: Rapper[]
  selectedRapper?: Rapper | null
  onSelectRapper?: (rapper: Rapper) => void
}

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87',
  mainstream: '#ff6b00',
  old_school: '#3b82f6',
  underground: '#a855f7',
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2))
}

export default function Map({ rappers, selectedRapper, onSelectRapper }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [selected, setSelected] = useState<Rapper | null>(null)
  const [nearbyList, setNearbyList] = useState<Rapper[] | null>(null)

  const selectRapper = (rapper: Rapper) => {
    setSelected(rapper)
    if (onSelectRapper) onSelectRapper(rapper)
  }

  useEffect(() => {
    if (!selectedRapper) return
    setSelected(selectedRapper)
    setNearbyList(null)
    if (map.current) {
      map.current.flyTo({
        center: [selectedRapper.longitude, selectedRapper.latitude],
        zoom: 11,
        speed: 1.5,
      })
    }
  }, [selectedRapper?.id])

  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-6.0, 29.0],
      zoom: 5.2,
    })

    map.current.on('load', () => {
      map.current!.addSource('rappers-heat', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: rappers.map(r => ({
            type: 'Feature',
            properties: { weight: r.activity_score / 100 },
            geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] }
          }))
        }
      })

      map.current!.addLayer({
        id: 'rappers-heatmap',
        type: 'heatmap',
        source: 'rappers-heat',
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': 1.5,
          'heatmap-radius': 60,
          'heatmap-opacity': 0.75,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(255,80,0,0.3)',
            0.5, 'rgba(255,120,0,0.6)',
            0.8, 'rgba(255,160,0,0.8)',
            1, 'rgba(255,200,50,1)'
          ]
        }
      })

      map.current!.on('click', (e) => {
        const clickLat = e.lngLat.lat
        const clickLng = e.lngLat.lng
        const zoom = map.current!.getZoom()
        const threshold = 2 / zoom

        const nearby = rappers.filter(r =>
          getDistance(clickLat, clickLng, r.latitude, r.longitude) < threshold
        )

        if (nearby.length === 1) {
          selectRapper(nearby[0])
          setNearbyList(null)
        } else if (nearby.length > 1) {
          setNearbyList(nearby)
          setSelected(null)
        } else {
          setSelected(null)
          setNearbyList(null)
        }
      })
    })
  }, [rappers])

  const color = selected ? (categoryColors[selected.category] ?? '#ff6b00') : '#ff6b00'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {nearbyList && (
        <div style={{
          position: 'absolute', bottom: '32px', right: '32px', width: '300px',
          background: 'rgba(8,8,12,0.97)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,107,0,0.2)', borderRadius: '20px',
          overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
          animation: 'fadeUp 0.3s ease', zIndex: 10,
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>🔥 {nearbyList.length} rappeurs ici</span>
            <button onClick={() => setNearbyList(null)} style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white',
              width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px',
            }}>✕</button>
          </div>
          <div style={{ padding: '8px' }}>
            {nearbyList.map(rapper => (
              <button key={rapper.id} onClick={() => { selectRapper(rapper); setNearbyList(null) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '12px', background: 'transparent',
                  border: 'none', cursor: 'pointer', color: 'white', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  overflow: 'hidden', border: '2px solid ' + (categoryColors[rapper.category] ?? '#ff6b00'),
                  boxShadow: '0 0 12px ' + (categoryColors[rapper.category] ?? '#ff6b00') + '88',
                  background: 'radial-gradient(circle, ' + (categoryColors[rapper.category] ?? '#ff6b00') + ' 0%, ' + (categoryColors[rapper.category] ?? '#ff6b00') + '66 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  {rapper.profile_image_url
                    ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🎤'
                  }
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{rapper.name}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>📍 {rapper.neighborhood}</p>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#ff6b00',
                  background: 'rgba(255,107,0,0.1)', padding: '2px 8px', borderRadius: '20px',
                }}>{rapper.activity_score}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div style={{
          position: 'absolute', bottom: '32px', right: '32px', width: '340px',
          background: 'rgba(8,8,12,0.97)', backdropFilter: 'blur(24px)',
          border: '1px solid ' + color + '33', borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 0 40px ' + color + '15, 0 20px 60px rgba(0,0,0,0.9)',
          animation: 'fadeUp 0.3s ease', zIndex: 10,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, ' + color + '22, transparent)',
            padding: '20px 20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <button onClick={() => setSelected(null)} style={{
              position: 'absolute', top: '14px', right: '14px',
              background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white',
              width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px',
            }}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                overflow: 'hidden', border: '2px solid ' + color,
                boxShadow: '0 0 20px ' + color + '88',
                background: 'radial-gradient(circle, ' + color + ' 0%, ' + color + '66 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
              }}>
                {selected.profile_image_url
                  ? <img src={selected.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🎤'
                }
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '20px', marginBottom: '4px' }}>{selected.name}</h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  📍 {selected.city} — {selected.neighborhood}
                </p>
                <span style={{
                  display: 'inline-block', marginTop: '6px', padding: '2px 10px',
                  borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  background: color + '22', color: color, border: '1px solid ' + color + '44',
                }}>{selected.category.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 20px 20px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '16px' }}>
              {selected.short_bio}
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
              padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Activité</span>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: selected.activity_score + '%', height: '100%',
                  background: 'linear-gradient(90deg, #ff6b00, #ffaa00)', borderRadius: '2px',
                }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b00' }}>{selected.activity_score}</span>
            </div>

            <a href={'/rapper/' + selected.slug} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #ff6b00, #ff9500)',
              borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '14px',
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,107,0,0.3)',
              marginBottom: '8px', boxSizing: 'border-box',
            }}>
              🔥 Voir le profil & Parier
            </a>

            {selected.social_links?.youtube && (
              <a href={'https://youtube.com/@' + selected.social_links.youtube}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '12px',
                  background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                  borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '14px',
                  textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,0,0,0.3)',
                  boxSizing: 'border-box',
                }}>
                ▶ Voir sur YouTube
              </a>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}