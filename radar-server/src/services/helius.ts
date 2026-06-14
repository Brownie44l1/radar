import { cacheGet, cacheSet } from "../cache/redis"
import { CACHE_TTL } from "../constants/riskWeights"
import type { HolderData } from "../types"

interface RpcResponse<T> {
  result?: T
  error?: { message: string }
}

interface SupplyResult {
  value: { amount: string }
}

interface LargestResult {
  value: { address: string; amount: string; decimals: number }[]
}

export async function getTopHolders(address: string): Promise<HolderData | null> {
  const cacheKey = `holders:${address.toLowerCase()}`
  const cached = await cacheGet<HolderData>(cacheKey)
  if (cached) return cached

  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) {
    console.warn("HELIUS_API_KEY is not configured")
    return null
  }

  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`

  try {
    const [supplyRes, largestRes] = await Promise.all([
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "get-supply",
          method: "getTokenSupply",
          params: [address],
        }),
      }),
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "get-largest",
          method: "getTokenLargestAccounts",
          params: [address],
        }),
      }),
    ])

    if (!supplyRes.ok || !largestRes.ok) {
      console.warn("Helius RPC request failed with non-200 status")
      return null
    }

    const supplyData = await supplyRes.json() as RpcResponse<SupplyResult>
    const largestData = await largestRes.json() as RpcResponse<LargestResult>

    if (supplyData.error || largestData.error) {
      console.warn("Helius RPC returned error:", supplyData.error || largestData.error)
      return null
    }

    const totalSupply = parseFloat(supplyData.result?.value?.amount || "0")
    if (totalSupply === 0) return null

    const accounts = largestData.result?.value || []
    const topHolders = accounts.slice(0, 10).map((acc) => {
      const balance = parseFloat(acc.amount || "0")
      const percent = totalSupply > 0 ? (balance / totalSupply) * 100 : 0
      return {
        address: acc.address,
        percent: parseFloat(percent.toFixed(2)),
      }
    })

    const topHolderPercent = parseFloat(
      topHolders.reduce((sum: number, holder) => sum + holder.percent, 0).toFixed(2)
    )

    const holderData: HolderData = {
      topHolderPercent,
      topHolders,
    }

    await cacheSet(cacheKey, holderData, CACHE_TTL.HOLDERS) // Cache for 30 minutes
    return holderData
  } catch (e) {
    console.error("getTopHolders error:", e)
    return null // Graceful fallback
  }
}
