import { Hono } from "hono"
import { computeRiskScore } from "../services/riskScore"
import { getTokenData, searchTokens } from "../services/dexscreener"
import { getTopHolders } from "../services/helius"
import { detectBundle } from "../services/bundleDetect"
import { checkSmartMoney } from "../services/smartMoney"

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
    let holderData = null
    let bundleDetected = null
    let smartMoneyMatches = { count: 0, matches: [] as any[] }

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
    // For token age: use default of 48 hours unless we can compute it (handled gracefully in risk score)
    const riskSignals = {
      liquidity: tokenData.liquidity,
      topHolderPercent: holderData?.topHolderPercent || 0,
      bundleDetected: !!bundleDetected,
      tokenAgeHours: 48, 
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
  } catch (e: any) {
    console.error("Token route error:", e)
    return c.json({ data: null, error: { message: e.message || "Internal server error", code: "INTERNAL_ERROR" } }, 500)
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
  } catch (e: any) {
    console.error("Search route error:", e)
    return c.json({ data: null, error: { message: e.message || "Internal server error", code: "INTERNAL_ERROR" } }, 500)
  }
})

export default app
