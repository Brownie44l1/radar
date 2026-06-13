import { cacheGet, cacheSet } from "../cache/redis"
import { CACHE_TTL } from "../constants/riskWeights"
import { supabase } from "../db/client"
import { getTopHolders } from "./helius"

export interface SmartMoneyResult {
  count: number
  matches: { address: string; label: string }[]
}

export async function checkSmartMoney(tokenAddress: string): Promise<SmartMoneyResult> {
  const cacheKey = `smartmoney:matches:${tokenAddress.toLowerCase()}`
  const cached = await cacheGet<SmartMoneyResult>(cacheKey)
  if (cached) return cached

  const defaultResult: SmartMoneyResult = { count: 0, matches: [] }

  try {
    // 1. Get top holders of the token
    const holdersData = await getTopHolders(tokenAddress)
    if (!holdersData || !holdersData.topHolders || holdersData.topHolders.length === 0) {
      return defaultResult
    }

    const holderAddresses = holdersData.topHolders.map((h) => h.address)

    // 2. Query Supabase smart_money_wallets table
    const { data, error } = await supabase
      .from("smart_money_wallets")
      .select("wallet_address, label")
      .in("wallet_address", holderAddresses)

    if (error) {
      console.error("Supabase query error in checkSmartMoney:", error)
      return defaultResult
    }

    if (!data || data.length === 0) {
      await cacheSet(cacheKey, defaultResult, CACHE_TTL.SMART_MONEY)
      return defaultResult
    }

    const matches = data.map((row: any) => ({
      address: row.wallet_address,
      label: row.label || "Smart Money Wallet",
    }))

    const result: SmartMoneyResult = {
      count: matches.length,
      matches,
    }

    await cacheSet(cacheKey, result, CACHE_TTL.SMART_MONEY) // Cache for 1 hour
    return result
  } catch (e) {
    console.error("checkSmartMoney error:", e)
    return defaultResult
  }
}
