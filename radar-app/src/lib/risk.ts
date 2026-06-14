export function getVerdictExplanation(
  riskScore: number,
  _verdict: string,
  bundleDetected: boolean | null,
  topHolderPercent: number | null,
): string {
  if (bundleDetected) {
    return "Multiple transactions from the same funding source detected in the same block — this is a strong rug signal."
  }
  if (riskScore > 60) {
    return "High risk score due to low liquidity, high holder concentration, or very recent creation — proceed with extreme caution."
  }
  if (riskScore > 30) {
    return "Moderate risk: some warning flags present. Review the on-chain metrics before investing."
  }
  if (topHolderPercent && topHolderPercent > 40) {
    return "Low risk score but top holders control a significant portion of supply — monitor for dumps."
  }
  return "No major risk flags detected. Always DYOR before investing."
}

export function getBadgeColor(verdict: string, score: number): string {
  if (verdict.includes("Proceed")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800"
  }
  if (verdict.includes("Rug") || verdict.includes("Flag") || score > 60) {
    return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-300 dark:border-red-800"
  }
  return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border-green-300 dark:border-green-800"
}
