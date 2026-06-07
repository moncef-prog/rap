export type BetMode = 'trending' | 'charts' | 'project'

export type TrendingBetKey = 'top5' | 'streams1m' | 'top1_3days' | 'top10_drop' | 'collab'
export type ChartsBetKey = 'enter_top5' | 'stay_top10' | 'lose_places' | 'exit_charts'
export type ProjectBetKey = 'success' | 'flop' | 'top1' | 'better' | 'international'

export type BetType = TrendingBetKey | ChartsBetKey | ProjectBetKey

export const trendingBetMultipliers: Record<TrendingBetKey, number> = {
  top5: 1.7,
  streams1m: 2.1,
  top1_3days: 2.5,
  top10_drop: 1.4,
  collab: 3.2,
}

export const chartsBetMultipliers: Record<ChartsBetKey, number> = {
  enter_top5: 1.9,
  stay_top10: 1.4,
  lose_places: 2.2,
  exit_charts: 2.8,
}

const projectOddsMap: Record<string, Record<ProjectBetKey, number>> = {
  high: { success: 1.2, flop: 4.0, top1: 2.5, better: 1.4, international: 3.5 },
  mid: { success: 1.8, flop: 2.5, top1: 3.2, better: 2.0, international: 4.0 },
  low: { success: 2.5, flop: 1.5, top1: 4.5, better: 2.8, international: 5.0 },
}

export function isTrendingBetKey(value: string): value is TrendingBetKey {
  return value in trendingBetMultipliers
}

export function isChartsBetKey(value: string): value is ChartsBetKey {
  return value in chartsBetMultipliers
}

export function isProjectBetKey(value: string): value is ProjectBetKey {
  return value in projectOddsMap.low
}

export function getProjectOdds(score: number, type: ProjectBetKey): number {
  const key = score >= 90 ? 'high' : score >= 70 ? 'mid' : 'low'
  return projectOddsMap[key][type]
}

export function getBetMultiplier(mode: BetMode, betType: BetType, rapperScore: number): number | null {
  if (mode === 'trending' && isTrendingBetKey(betType)) return trendingBetMultipliers[betType]
  if (mode === 'charts' && isChartsBetKey(betType)) return chartsBetMultipliers[betType]
  if (mode === 'project' && isProjectBetKey(betType)) return getProjectOdds(rapperScore, betType)
  return null
}
