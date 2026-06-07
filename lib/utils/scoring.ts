export function calculateScore(popularity: number, followers: number): number {
  const score = (popularity * 0.6) + (Math.min(followers / 10000, 40))
  return Math.min(Math.round(score), 99)
}

export function calculateOdds(score: number): number {
  const odds = parseFloat((2.5 - (score / 100) * 1.5).toFixed(1))
  return Math.max(odds, 1.1)
}
