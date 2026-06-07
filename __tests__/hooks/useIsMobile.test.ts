import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/lib/useIsMobile'

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('useIsMobile', () => {
  beforeEach(() => {
    setViewport(1024)
  })

  it('retourne false sur desktop (>768px)', () => {
    setViewport(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('retourne true sur mobile (<768px)', () => {
    setViewport(375)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('retourne false exactement à la valeur du breakpoint (768)', () => {
    setViewport(768)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('retourne true juste en-dessous du breakpoint (767)', () => {
    setViewport(767)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('réagit au resize de la fenêtre', () => {
    setViewport(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => setViewport(375))
    expect(result.current).toBe(true)

    act(() => setViewport(1440))
    expect(result.current).toBe(false)
  })

  it('accepte un breakpoint personnalisé', () => {
    setViewport(900)
    const { result } = renderHook(() => useIsMobile(1024))
    expect(result.current).toBe(true)
  })

  it('nettoie le listener resize au démontage', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})
