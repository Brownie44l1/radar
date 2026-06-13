import { RISK_WEIGHTS, RISK_THRESHOLDS, RISK_VERDICTS } from "../constants/riskWeights"
import type { RiskSignals } from "../types"

export function computeRiskScore(signals: RiskSignals): { score: number; verdict: string } {
  let score = 0

  if (signals.liquidity < 50_000) score += RISK_WEIGHTS.LOW_LIQUIDITY
  if (signals.topHolderPercent > 40) score += RISK_WEIGHTS.HIGH_HOLDER_CONCENTRATION
  if (signals.bundleDetected) score += RISK_WEIGHTS.BUNDLE_DETECTED
  if (signals.tokenAgeHours < 24) score += RISK_WEIGHTS.VERY_NEW_TOKEN
  if (signals.smartMoneyCount > 0) score += RISK_WEIGHTS.SMART_MONEY_PRESENT

  score = Math.max(0, Math.min(100, score))

  const verdict =
    score <= RISK_THRESHOLDS.LOW
      ? RISK_VERDICTS.LOW
      : score <= RISK_THRESHOLDS.MEDIUM
      ? RISK_VERDICTS.MEDIUM
      : RISK_VERDICTS.HIGH

  return { score, verdict }
}
