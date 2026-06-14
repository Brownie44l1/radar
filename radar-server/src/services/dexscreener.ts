import { cacheGet, cacheSet } from "../cache/redis"
import { CACHE_TTL } from "../constants/riskWeights"
import type { TokenData } from "../types"

const BASE_URL = "https://api.dexscreener.com"

interface DexScreenerPair {
  chainId: string
  baseToken: { address: string; symbol: string; name: string }
  priceUsd?: string
  liquidity?: { usd: number }
  marketCap?: number
  volume?: { h24: number }
  priceChange?: { h24: number }
  pairCreatedAt?: number
}

function mapPair(pair: DexScreenerPair): TokenData {
  return {
    address: pair.baseToken.address,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    chain: pair.chainId,
    price: parseFloat(pair.priceUsd || "0"),
    liquidity: pair.liquidity?.usd || 0,
    marketCap: pair.marketCap || 0,
    volume24h: pair.volume?.h24 || 0,
    priceChange24h: pair.priceChange?.h24 || 0,
    pairCreatedAt: pair.pairCreatedAt,
    cachedAt: Date.now(),
  }
}

export async function searchTokens(query: string): Promise<TokenData[] | null> {
  const cacheKey = `search:${query.toLowerCase()}`
  const cached = await cacheGet<TokenData[]>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return null
    const data = await res.json() as { pairs: DexScreenerPair[] }
    if (!data.pairs) return []

    const tokens: TokenData[] = []
    const seen = new Set<string>()

    for (const raw of data.pairs) {
      const pair = raw
      const key = `${pair.chainId}:${pair.baseToken.address}`
      if (seen.has(key)) continue
      seen.add(key)

      tokens.push(mapPair(pair))
      if (tokens.length >= 20) break
    }

    await cacheSet(cacheKey, tokens, CACHE_TTL.PRICE)
    return tokens
  } catch (e) {
    console.error("searchTokens error:", e)
    return null
  }
}

export async function getTokenData(address: string, chain: string): Promise<TokenData | null> {
  const normalizedChain = chain.toLowerCase()
  const cacheKey = `token:${normalizedChain}:${address.toLowerCase()}`
  const cached = await cacheGet<TokenData>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${BASE_URL}/latest/dex/tokens/${address}`)
    if (!res.ok) return null
    const data = await res.json() as { pairs: DexScreenerPair[] }
    if (!data.pairs || data.pairs.length === 0) return null

    const chainPairs = data.pairs
      .filter((p) => p.chainId.toLowerCase() === normalizedChain)
    if (chainPairs.length === 0) return null

    chainPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
    const bestPair = chainPairs[0]
    if (!bestPair) return null

    const tokenData = mapPair(bestPair)

    await cacheSet(cacheKey, tokenData, CACHE_TTL.PRICE)
    return tokenData
  } catch (e) {
    console.error("getTokenData error:", e)
    return null
  }
}

export async function getTrending(): Promise<TokenData[] | null> {
  const cacheKey = "trending"
  const cached = await cacheGet<TokenData[]>(cacheKey)
  if (cached) return cached

  try {
    const boostsRes = await fetch(`${BASE_URL}/token-boosts/top/v1`)
    let addresses: string[] = []
    
    if (boostsRes.ok) {
      const boosts = await boostsRes.json()
      if (Array.isArray(boosts)) {
        const uniqueAddrs = new Set<string>()
        for (const item of boosts) {
          if (item.tokenAddress) {
            uniqueAddrs.add(item.tokenAddress)
          }
          if (uniqueAddrs.size >= 20) break
        }
        addresses = Array.from(uniqueAddrs)
      }
    }

    if (addresses.length === 0) {
      addresses = [
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      ]
    }

    const tokensRes = await fetch(`${BASE_URL}/latest/dex/tokens/${addresses.join(",")}`)
    if (!tokensRes.ok) return null
    const tokensData = await tokensRes.json() as { pairs: DexScreenerPair[] }
    if (!tokensData.pairs) return []

    const tokens: TokenData[] = []
    const seen = new Set<string>()

    for (const raw of tokensData.pairs) {
      const pair = raw
      const key = `${pair.chainId}:${pair.baseToken.address}`
      if (seen.has(key)) continue
      seen.add(key)

      tokens.push(mapPair(pair))
      if (tokens.length >= 20) break
    }

    await cacheSet(cacheKey, tokens, CACHE_TTL.TRENDING)
    return tokens
  } catch (e) {
    console.error("getTrending error:", e)
    return null
  }
}
