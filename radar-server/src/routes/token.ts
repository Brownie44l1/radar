import { Hono } from "hono"
import { computeRiskScore } from "../services/riskScore"
import { getTokenData, searchTokens } from "../services/dexscreener"
import { getTopHolders } from "../services/helius"
import { detectBundle } from "../services/bundleDetect"
import { checkSmartMoney } from "../services/smartMoney"
import type { SmartMoneyResult } from "../services/smartMoney"

const app = new Hono()

// GET /token/:address - Fetch token research card by address
app.get("/:address", async (c) => {
  try {
    const address = c.req.param("address")
    const chain = c.req.query("chain") || "solana"

    if (!address) {
      return c.json({ data: null, error: { message: "Address is required", code: "VALIDATION_ERROR" } }, 400)
    }

    // 1. Fetch token data from DEXScreener
    const tokenData = await getTokenData(address, chain)
    if (!tokenData) {
      return c.json({ data: null, error: { message: "Token not found", code: "NOT_FOUND" } }, 404)
    }

    // 2. Fetch Solana-specific data in parallel if chain is solana
    const isSolana = chain.toLowerCase() === "solana"
    let holderData: Awaited<ReturnType<typeof getTopHolders>> = null
    let bundleDetected: Awaited<ReturnType<typeof detectBundle>> = null
    let smartMoneyMatches: SmartMoneyResult = { count: 0, matches: [] }

    if (isSolana) {
      const [holders, bundle, smartMoney] = await Promise.all([
        getTopHolders(address),
        detectBundle(address),
        checkSmartMoney(address),
      ])
      holderData = holders
      bundleDetected = bundle
      smartMoneyMatches = smartMoney
    }

    // 3. Compute Risk Score
    const tokenAgeHours = tokenData.pairCreatedAt
      ? (Date.now() - tokenData.pairCreatedAt) / 3_600_000
      : 0
    const riskSignals = {
      liquidity: tokenData.liquidity,
      topHolderPercent: holderData?.topHolderPercent || 0,
      bundleDetected: !!bundleDetected,
      tokenAgeHours,
      smartMoneyCount: smartMoneyMatches.count,
    }

    const { score, verdict } = computeRiskScore(riskSignals)

    const researchCard = {
      tokenData,
      holderData,
      bundleDetected,
      smartMoneyMatches: smartMoneyMatches.matches,
      riskScore: score,
      verdict,
      isLive: true, // will be tagged by client or cache logic
    }

    return c.json({
      data: researchCard,
      error: null,
    })
  } catch (e: unknown) {
    console.error("Token route error:", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    return c.json({ data: null, error: { message, code: "INTERNAL_ERROR" } }, 500)
  }
})

// GET /token/search/:query - Search tokens
app.get("/search/:query", async (c) => {
  try {
    const query = c.req.param("query")
    if (!query) {
      return c.json({ data: null, error: { message: "Query is required", code: "VALIDATION_ERROR" } }, 400)
    }

    const results = await searchTokens(query)
    return c.json({
      data: results,
      error: null,
    })
  } catch (e: unknown) {
    console.error("Search route error:", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    return c.json({ data: null, error: { message, code: "INTERNAL_ERROR" } }, 500)
  }
})

export default app
