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
  cachedAt: number
}

export interface ResearchCard {
  tokenData: TokenData
  holderData: { topHolderPercent: number } | null
  bundleDetected: boolean | null
  smartMoneyMatches: { address: string; label: string }[]
  riskScore: number
  verdict: string
  isLive: boolean
}

export interface TrendingToken {
  address: string
  symbol: string
  name: string
  chain: string
  price: number
  priceChange24h: number
  volume24h: number
}
