export const RISK_WEIGHTS = {
  LOW_LIQUIDITY: 30,
  HIGH_HOLDER_CONCENTRATION: 25,
  BUNDLE_DETECTED: 35,
  VERY_NEW_TOKEN: 15,
  SMART_MONEY_PRESENT: -20,
} as const

export const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
} as const

export const CACHE_TTL = {
  PRICE: 30,
  LIQUIDITY: 120,
  HOLDERS: 1800,
  SMART_MONEY: 3600,
  BUNDLE: 0,
  TRENDING: 300,
} as const

export const RISK_VERDICTS = {
  LOW: "✅ No major flags",
  MEDIUM: "⚠️ Proceed with caution",
  HIGH: "🚨 Rug signals detected",
} as const
