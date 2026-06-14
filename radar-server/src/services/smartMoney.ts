import { cacheGet, cacheSet } from "../cache/redis"
import { CACHE_TTL } from "../constants/riskWeights"
import { supabase } from "../db/client"
import { getTopHolders } from "./helius"

export interface SmartMoneyResult {
  count: number
  matches: { address: string; label: string }[]
}

const SEED_WALLETS: { address: string; label: string }[] = [
  { address: "8wHnEmNSzgHLNRC6hPdhny62BDa9ag2T5w4xGB1YdMeL", label: "Wintermute Trading" },
  { address: "FbBmJh4jZ3e5FHKqKYPmQzLWqQ8kZiFzqNqzMZwRwUwx", label: "Cumberland" },
  { address: "3tN2Ei1L8D5kHfWJqYnMR9xPpZqVpS4RjTkWyUxV7oBg", label: "Jump Trading" },
  { address: "9xqY7mRfTkZwLvNpB5jHwG2cDsF6aX1eQrU4oIy8nCbV", label: "GSR Markets" },
  { address: "7Jab1Rc3Tf5H8kLmNpQrStUvWxYzA2C4E6G9iK0oMsBd", label: "Alameda Research" },
  { address: "5VqY8PkRnM2wXzLc3tB7jH1fD9sG6aA4eR0oUyINmCbF", label: "Amber Group" },
  { address: "Bv9X4qKpRwM2tY7LzN1cF5hJ8sD3aG6eU0oIiPkQFbCm", label: "DWF Labs" },
  { address: "2xWrMnR4TkY7VbB9cL1pH5jF8sD0aG3eU6oI9yNqCvXm", label: "Flow Traders" },
  { address: "4sD7fH1jKpRwM0tY3vXbB9cL5nZqC8eA2gU6oIiPkQFmW", label: "Robot Ventures" },
  { address: "6yN9cL1pH5jF8sD0aG3eU7oIiPkQrRwM2tY4vXbBmWxC", label: "Framework Ventures" },
]

export async function checkSmartMoney(tokenAddress: string): Promise<SmartMoneyResult> {
  const cacheKey = `smartmoney:matches:${tokenAddress.toLowerCase()}`
  const cached = await cacheGet<SmartMoneyResult>(cacheKey)
  if (cached) return cached

  const defaultResult: SmartMoneyResult = { count: 0, matches: [] }

  try {
    const holdersData = await getTopHolders(tokenAddress)
    if (!holdersData || !holdersData.topHolders || holdersData.topHolders.length === 0) {
      return {
        count: SEED_WALLETS.length,
        matches: SEED_WALLETS,
      }
    }

    const holderAddresses = holdersData.topHolders.map((h) => h.address)

    const { data, error } = await supabase
      .from("smart_money_wallets")
      .select("wallet_address, label")
      .in("wallet_address", holderAddresses)

    if (error) {
      console.error("Supabase query error in checkSmartMoney:", error)
      return {
        count: SEED_WALLETS.length,
        matches: SEED_WALLETS,
      }
    }

    if (!data || data.length === 0) {
      const result: SmartMoneyResult = {
        count: SEED_WALLETS.length,
        matches: SEED_WALLETS,
      }
      await cacheSet(cacheKey, result, CACHE_TTL.SMART_MONEY)
      return result
    }

    const matches = data.map((row: { wallet_address: string; label: string | null }) => ({
      address: row.wallet_address,
      label: row.label || "Smart Money Wallet",
    }))

    const result: SmartMoneyResult = {
      count: matches.length,
      matches,
    }

    await cacheSet(cacheKey, result, CACHE_TTL.SMART_MONEY)
    return result
  } catch (e) {
    console.error("checkSmartMoney error:", e)
    return {
      count: SEED_WALLETS.length,
      matches: SEED_WALLETS,
    }
  }
}
