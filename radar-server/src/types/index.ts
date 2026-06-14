export interface TokenData {
  address: string
  symbol: string
  name: string
  chain: string
  price: number
  liquidity: number
  marketCap: number
  volume24h: number
  priceChange24h: number
  pairCreatedAt?: number
  cachedAt: number
}

export interface HolderData {
  topHolderPercent: number
  topHolders: { address: string; percent: number }[]
}

export interface RiskSignals {
  liquidity: number
  topHolderPercent: number
  bundleDetected: boolean
  tokenAgeHours: number
  smartMoneyCount: number
}

export interface ResearchCard {
  tokenData: TokenData
  holderData: HolderData | null
  bundleDetected: boolean | null
  smartMoneyMatches: { address: string; label: string }[]
  riskScore: number
  verdict: string
  isLive: boolean
}

export interface ApiResponse<T> {
  data: T | null
  error: { message: string; code: string } | null
}
