export type MEOScoreInput = { replyRate:number; avgRating:number; monthlyPosts:number; searchViews:number }
export function calculateMEOScore({ replyRate, avgRating, monthlyPosts, searchViews }: MEOScoreInput): number {
  const normalizedRate = replyRate > 1 ? replyRate / 100 : replyRate
  return Math.round(normalizedRate * 35 + (avgRating / 5) * 35 + Math.min(monthlyPosts / 4, 1) * 20 + Math.min(searchViews / 3000, 1) * 10)
}
