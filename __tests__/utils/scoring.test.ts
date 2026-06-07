import { calculateScore, calculateOdds } from '@/lib/utils/scoring'

describe('calculateScore', () => {
  it('retourne 0 pour popularité et followers à 0', () => {
    expect(calculateScore(0, 0)).toBe(0)
  })

  it('calcule correctement le score avec popularité seule', () => {
    // 80 * 0.6 = 48
    expect(calculateScore(80, 0)).toBe(48)
  })

  it('plafonne les followers à 40 points max', () => {
    // popularité 0, 400 000 followers = 40 points max
    expect(calculateScore(0, 400_000)).toBe(40)
    // même résultat avec plus de followers
    expect(calculateScore(0, 1_000_000)).toBe(40)
  })

  it('combine popularité et followers correctement', () => {
    // 70 * 0.6 = 42 + min(100000/10000, 40) = 10 → 52
    expect(calculateScore(70, 100_000)).toBe(52)
  })

  it('ne dépasse jamais 99', () => {
    expect(calculateScore(100, 1_000_000)).toBe(99)
  })

  it('arrondit au nombre entier', () => {
    // 50 * 0.6 = 30, 5000/10000 = 0.5 → 30.5 → 31
    expect(calculateScore(50, 5_000)).toBe(31)
  })
})

describe('calculateOdds', () => {
  it('retourne 2.5 pour un score de 0', () => {
    expect(calculateOdds(0)).toBe(2.5)
  })

  it('retourne 1.0 pour un score de 100', () => {
    // 2.5 - (100/100 * 1.5) = 1.0, mais le minimum est 1.1
    expect(calculateOdds(100)).toBe(1.1)
  })

  it('retourne 1.9 pour un score de 40', () => {
    // 2.5 - (40/100 * 1.5) = 2.5 - 0.6 = 1.9
    expect(calculateOdds(40)).toBe(1.9)
  })

  it('ne descend jamais sous 1.1', () => {
    expect(calculateOdds(99)).toBeGreaterThanOrEqual(1.1)
    expect(calculateOdds(100)).toBe(1.1)
  })

  it('décroît quand le score augmente (meilleur artiste = moins bonne cote)', () => {
    expect(calculateOdds(80)).toBeLessThan(calculateOdds(40))
  })

  it('retourne une valeur avec une décimale', () => {
    const odds = calculateOdds(50)
    const decimals = odds.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(1)
  })
})
