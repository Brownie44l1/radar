import crypto from "crypto"
import { Hono } from "hono"
import { supabase } from "../db/client"
import { getTokenData } from "../services/dexscreener"

const app = new Hono()

// Helper to validate Telegram init data
function getTelegramUser(authHeader: string | undefined) {
  if (!authHeader) return null

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return null

  const rawInitData = authHeader.replace(/^tma\s+/i, "")

  try {
    const params = new URLSearchParams(rawInitData)
    const hash = params.get("hash")
    if (!hash) return null

    params.delete("hash")
    const sortedKeys = Array.from(params.keys()).sort()
    const dataCheckString = sortedKeys.map((key) => `${key}=${params.get(key)}`).join("\n")

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    if (calculatedHash === hash) {
      const userString = params.get("user")
      if (userString) {
        return JSON.parse(userString)
      }
    }
  } catch (e) {
    console.error("Init data validation error:", e)
  }

  return null
}

// POST /alerts - Create price alert
app.post("/", async (c) => {
  try {
    const authHeader = c.req.header("Authorization")
    const user = getTelegramUser(authHeader)

    if (!user) {
      return c.json(
        { data: null, error: { message: "Unauthorized - Invalid Telegram Session", code: "UNAUTHORIZED" } },
        401
      )
    }

    const { tokenAddress, targetPrice, tokenSymbol, tokenChain } = await c.req.json()

    if (!tokenAddress || !targetPrice || !tokenChain) {
      return c.json({ data: null, error: { message: "Missing required fields", code: "VALIDATION_ERROR" } }, 400)
    }

    // Ensure user exists in users table to prevent foreign key errors
    await supabase.from("users").upsert({
      id: user.id,
      username: user.username || null,
      first_name: user.first_name || null,
      last_active: new Date().toISOString(),
    })

    // Fetch current price to determine alert direction
    const tokenData = await getTokenData(tokenAddress, tokenChain)
    const currentPrice = tokenData ? tokenData.price : 0
    const direction = targetPrice > currentPrice ? "above" : "below"

    // Insert alert
    const { data, error } = await supabase
      .from("alerts")
      .insert({
        user_id: user.id,
        token_address: tokenAddress,
        token_symbol: tokenSymbol || tokenData?.symbol || null,
        token_chain: tokenChain.toLowerCase(),
        target_price: targetPrice,
        direction,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase insert alert error:", error)
      return c.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, 500)
    }

    return c.json({
      data,
      error: null,
    })
  } catch (e: unknown) {
    console.error("Create alert error:", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    return c.json({ data: null, error: { message, code: "INTERNAL_ERROR" } }, 500)
  }
})

// DELETE /alerts/:id - Cancel alert
app.delete("/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization")
    const user = getTelegramUser(authHeader)
    const id = c.req.param("id")

    if (!user) {
      return c.json(
        { data: null, error: { message: "Unauthorized - Invalid Telegram Session", code: "UNAUTHORIZED" } },
        401
      )
    }

    // Set is_active = false
    const { data, error } = await supabase
      .from("alerts")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()

    if (error) {
      console.error("Supabase delete alert error:", error)
      return c.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, 500)
    }

    return c.json({
      data: { success: true },
      error: null,
    })
  } catch (e: unknown) {
    console.error("Cancel alert error:", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    return c.json({ data: null, error: { message, code: "INTERNAL_ERROR" } }, 500)
  }
})

export default app
export { getTelegramUser }
