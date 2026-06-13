import { cacheGet, cacheSet } from "../cache/redis"
import { CACHE_TTL } from "../constants/riskWeights"
import type { TokenData } from "../types"

const BASE_URL = "https://api.dexscreener.com"

export async function searchTokens(query: string): Promise<TokenData[] | null> {
  const cacheKey = `search:${query.toLowerCase()}`
  const cached = await cacheGet<TokenData[]>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.pairs) return []

    // Filter and map pairs
    const tokens: TokenData[] = []
    const seen = new Set<string>()

    for (const pair of data.pairs) {
      const address = pair.baseToken.address
      const chain = pair.chainId
      const key = `${chain}:${address}`
      if (seen.has(key)) continue
      seen.add(key)

      tokens.push({
        address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        chain,
        price: parseFloat(pair.priceUsd || "0"),
        liquidity: pair.liquidity?.usd || 0,
        marketCap: pair.marketCap || 0,
        volume24h: pair.volume?.h24 || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        cachedAt: Date.now(),
      })

      if (tokens.length >= 20) break
    }

    await cacheSet(cacheKey, tokens, CACHE_TTL.PRICE) // Cache search results for 30s
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
    const data = await res.json()
    if (!data.pairs || data.pairs.length === 0) return null

    // Filter pairs by the requested chain
    const chainPairs = data.pairs.filter((p: any) => p.chainId.toLowerCase() === normalizedChain)
    if (chainPairs.length === 0) return null

    // Sort by liquidity descending to get the main/most active pair
    chainPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
    const bestPair = chainPairs[0]

    const tokenData: TokenData = {
      address: bestPair.baseToken.address,
      symbol: bestPair.baseToken.symbol,
      name: bestPair.baseToken.name,
      chain: normalizedChain,
      price: parseFloat(bestPair.priceUsd || "0"),
      liquidity: bestPair.liquidity?.usd || 0,
      marketCap: bestPair.marketCap || 0,
      volume24h: bestPair.volume?.h24 || 0,
      priceChange24h: bestPair.priceChange?.h24 || 0,
      cachedAt: Date.now(),
    }

    await cacheSet(cacheKey, tokenData, CACHE_TTL.PRICE) // Cache token data for 30s (PRICE TTL)
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
    // 1. Fetch top boosted tokens
    const boostsRes = await fetch(`${BASE_URL}/token-boosts/top/v1`)
    let addresses: string[] = []
    
    if (boostsRes.ok) {
      const boosts = await boostsRes.json()
      if (Array.isArray(boosts)) {
        // Get unique token addresses
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

    // Fallback if no boosts found
    if (addresses.length === 0) {
      // Use some popular default tickers/addresses for Solana/Ethereum as fallback
      addresses = [
        "EKp5H2tV6T2Fw5vT5cE5e6K5T6Fw5vT5cE5e6K5T6Fw", // Dummy examples or popular addresses
        "So11111111111111111111111111111111111111112",
      ]
    }

    // 2. Fetch pair details for these addresses in bulk (up to 30)
    const tokensRes = await fetch(`${BASE_URL}/latest/dex/tokens/${addresses.join(",")}`)
    if (!tokensRes.ok) return null
    const tokensData = await tokensRes.json()
    if (!tokensData.pairs) return []

    // 3. Map pairs to TokenData
    const tokens: TokenData[] = []
    const seen = new Set<string>()

    for (const pair of tokensData.pairs) {
      const address = pair.baseToken.address
      const chain = pair.chainId
      const key = `${chain}:${address}`
      if (seen.has(key)) continue
      seen.add(key)

      tokens.push({
        address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        chain,
        price: parseFloat(pair.priceUsd || "0"),
        liquidity: pair.liquidity?.usd || 0,
        marketCap: pair.marketCap || 0,
        volume24h: pair.volume?.h24 || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        cachedAt: Date.now(),
      })

      if (tokens.length >= 20) break
    }

    await cacheSet(cacheKey, tokens, CACHE_TTL.TRENDING) // Cache trending for 5 mins
    return tokens
  } catch (e) {
    console.error("getTrending error:", e)
    return null
  }
}
