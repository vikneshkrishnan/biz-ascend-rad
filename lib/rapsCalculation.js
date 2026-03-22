/**
 * RAPS (Revenue Achievement Probability Score) Calculation
 * Implements Appendix 4 spec: two-layer architecture with stepped lookup tables
 * and additive RAD modifier.
 *
 * Shared utility for server-side (API route) and client-side (scenario simulator).
 */

// Sales cycle string → months midpoint
const CYCLE_MAP = {
  '<1 month': 0.5,
  '1–3 months': 2,
  '1\u20133 months': 2,
  '3–6 months': 4.5,
  '3\u20136 months': 4.5,
  '6–12 months': 9,
  '6\u201312 months': 9,
  '12+ months': 15,
}

// Win rate string → decimal midpoint
const WIN_RATE_MAP = {
  '<10%': 0.05,
  '10–20%': 0.15,
  '10\u201320%': 0.15,
  '20–30%': 0.25,
  '20\u201330%': 0.25,
  '30–40%': 0.35,
  '30\u201340%': 0.35,
  '40%+': 0.45,
}

// Legacy categorical q16 → pipeline coverage multiplier
const LEGACY_COVERAGE_MAP = {
  '<1× monthly revenue target': 0.5,
  '<1\u00d7 monthly revenue target': 0.5,
  '1–2×': 1.5,
  '1\u20132\u00d7': 1.5,
  '2–3×': 2.5,
  '2\u20133\u00d7': 2.5,
  '3–5×': 4,
  '3\u20135\u00d7': 4,
  '5×+': 5,
  '5\u00d7+': 5,
}

/**
 * Detect legacy categorical q16 and estimate open pipeline value.
 * Returns numeric pipeline value or null if not a legacy value.
 */
export function estimatePipelineFromLegacy(q16Value, revenueTarget) {
  const multiplier = LEGACY_COVERAGE_MAP[q16Value]
  if (multiplier === undefined) return null
  const monthlyTarget = (revenueTarget || 0) / 12
  return monthlyTarget * multiplier
}

/**
 * Parse a currency string or number into a float.
 */
export function parseCurrency(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  return parseFloat(String(val).replace(/[,$\s]/g, '')) || 0
}

/**
 * Parse win rate from screener — either a string label or a decimal number.
 */
export function parseWinRate(val) {
  if (typeof val === 'number') return val > 1 ? val / 100 : val
  return WIN_RATE_MAP[val] || 0.2
}

/**
 * Parse sales cycle from screener — either a string label or a number (months).
 */
export function parseSalesCycle(val) {
  if (typeof val === 'number') return val
  return CYCLE_MAP[val] || 3
}

/**
 * Core RAPS calculation implementing the spec's two-layer architecture.
 *
 * @param {object} inputs
 * @param {number} inputs.target - Revenue target
 * @param {number} inputs.invoiced - Revenue already invoiced
 * @param {number} inputs.fyEndMonth - Fiscal year end month (1-12)
 * @param {number} inputs.openPipeline - Total open pipeline value ($)
 * @param {number} inputs.winRate - Win rate as decimal (0-1)
 * @param {number} inputs.salesCycle - Sales cycle in months
 * @param {number} inputs.radScore - RAD Growth System Score (0-100)
 * @returns {object} Full RAPS result with all derived values
 */
export function calculateRAPS({
  target = 0,
  invoiced = 0,
  fyEndMonth = 12,
  openPipeline = 0,
  winRate = 0.2,
  salesCycle = 3,
  radScore = 50,
}) {
  // Revenue remaining
  const revenueRemaining = Math.max(0, target - invoiced)

  // Months remaining
  const now = new Date()
  const curMonth = now.getMonth() + 1
  let monthsRemaining = fyEndMonth >= curMonth
    ? fyEndMonth - curMonth
    : 12 - curMonth + fyEndMonth
  monthsRemaining = Math.max(monthsRemaining, 1)

  // Required monthly revenue
  const requiredMonthlyRevenue = revenueRemaining / monthsRemaining

  // --- Layer 1: Commercial Coverage Score ---

  // Time-to-Close Factor (stepped)
  const ratio = salesCycle / monthsRemaining
  let timeFactor
  if (ratio < 0.5) timeFactor = 1.0
  else if (ratio < 1.0) timeFactor = 0.7
  else if (ratio < 1.5) timeFactor = 0.4
  else timeFactor = 0.2

  // Expected convertible revenue
  const expectedConvertible = openPipeline * winRate * timeFactor

  // Coverage ratio
  let coverageRatio
  if (revenueRemaining <= 0) {
    coverageRatio = 999 // Target already met
  } else {
    coverageRatio = expectedConvertible / revenueRemaining
  }

  // Coverage rating
  let coverageRating
  if (coverageRatio > 1.2) coverageRating = 'Strong'
  else if (coverageRatio >= 0.9) coverageRating = 'Moderate'
  else if (coverageRatio >= 0.6) coverageRating = 'Weak'
  else coverageRating = 'Very Weak'

  // --- Layer 2: Base Probability + RAD Modifier ---

  // Base probability from coverage ratio
  let baseProbability
  if (coverageRatio > 1.2) baseProbability = 75
  else if (coverageRatio >= 0.9) baseProbability = 60
  else if (coverageRatio >= 0.6) baseProbability = 40
  else baseProbability = 20

  // RAD modifier (additive)
  let radModifierValue
  if (radScore >= 80) radModifierValue = 10
  else if (radScore >= 65) radModifierValue = 5
  else if (radScore >= 50) radModifierValue = 0
  else if (radScore >= 35) radModifierValue = -10
  else radModifierValue = -20

  // Final RAPS score
  const score = Math.max(0, Math.min(100, baseProbability + radModifierValue))

  // Interpretation label
  let label
  if (score >= 75) label = 'Strong'
  else if (score >= 55) label = 'Moderate'
  else if (score >= 35) label = 'Low-Moderate'
  else label = 'Low'

  return {
    score,
    label,
    revenueTarget: target,
    revenueInvoiced: invoiced,
    revenueRemaining,
    monthsRemaining,
    requiredMonthlyRevenue,
    openPipeline,
    winRate,
    salesCycle,
    timeFactor,
    expectedConvertible,
    coverageRatio: coverageRatio === 999 ? 999 : Math.round(coverageRatio * 100) / 100,
    coverageRating,
    baseProbability,
    radScore,
    radModifierValue,
  }
}

/**
 * Calculate a RAPS improvement scenario.
 * Takes current inputs and improved inputs, returns both scores and the delta.
 *
 * @param {object} current - Current RAPS inputs (same shape as calculateRAPS)
 * @param {object} improvements - Partial overrides for the improved scenario
 *   e.g. { winRate: 0.25, openPipeline: 48000000 }
 * @returns {object} { current, improved, delta }
 */
export function calculateRAPSImprovement(current, improvements = {}) {
  const currentResult = calculateRAPS(current)
  const improvedInputs = { ...current, ...improvements }
  const improvedResult = calculateRAPS(improvedInputs)

  return {
    current: {
      score: currentResult.score,
      label: currentResult.label,
      coverageRatio: currentResult.coverageRatio,
      coverageRating: currentResult.coverageRating,
      expectedConvertible: currentResult.expectedConvertible,
    },
    improved: {
      score: improvedResult.score,
      label: improvedResult.label,
      coverageRatio: improvedResult.coverageRatio,
      coverageRating: improvedResult.coverageRating,
      expectedConvertible: improvedResult.expectedConvertible,
      assumptions: improvements,
    },
    delta: improvedResult.score - currentResult.score,
  }
}
