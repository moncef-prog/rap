import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768) {
  // Lazy initializer : lit window.innerWidth dès le premier render client
  // → pas de flash "desktop" sur mobile
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    // Re-check au cas où la valeur initiale serait obsolète
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
