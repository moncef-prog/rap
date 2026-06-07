export type BackLevel = 'low' | 'medium' | 'high'

export const backLevels: Record<BackLevel, { label: 'LOW' | 'MEDIUM' | 'HIGH'; amount: number }> = {
  low: { label: 'LOW', amount: 100 },
  medium: { label: 'MEDIUM', amount: 500 },
  high: { label: 'HIGH', amount: 1000 },
}

export function isBackLevel(value: string): value is BackLevel {
  return value in backLevels
}

export function getBackBadge(amount: number, position: number): string {
  if (position <= 10) return 'OG'
  if (position <= 50) return 'Early Believer'
  if (amount >= 1000) return 'Whale'
  if (amount >= 500) return 'Top Supporter'
  return 'Believer'
}
