import { Hono } from "hono"
import { supabase } from "../db/client"
import { getTelegramUser } from "./alerts"

const app = new Hono()

// POST /wallets/submit - Submit smart money wallet
app.post("/submit", async (c) => {
  try {
    const authHeader = c.req.header("Authorization")
    const user = getTelegramUser(authHeader)

    if (!user) {
      return c.json(
        { data: null, error: { message: "Unauthorized - Invalid Telegram Session", code: "UNAUTHORIZED" } },
        401
      )
    }

    const { walletAddress, reason, chain = "solana" } = await c.req.json()

    if (!walletAddress) {
      return c.json(
        { data: null, error: { message: "Wallet address is required", code: "VALIDATION_ERROR" } },
        400
      )
    }

    // Ensure user exists in users table to prevent foreign key errors
    await supabase.from("users").upsert({
      id: user.id,
      username: user.username || null,
      first_name: user.first_name || null,
      last_active: new Date().toISOString(),
    })

    // Check if user has already submitted this wallet
    const { data: existing } = await supabase
      .from("wallet_submissions")
      .select("id")
      .eq("submitted_by", user.id)
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    if (existing) {
      return c.json({
        data: { message: "You have already submitted this wallet address for review." },
        error: null,
      })
    }

    // Insert wallet submission
    const { data, error } = await supabase
      .from("wallet_submissions")
      .insert({
        submitted_by: user.id,
        wallet_address: walletAddress,
        chain: chain.toLowerCase(),
        reason: reason || null,
        reviewed: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase insert wallet submission error:", error)
      return c.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, 500)
    }

    return c.json({
      data: {
        message: "Submitted - we'll review and add if it qualifies",
        submission: data,
      },
      error: null,
    })
  } catch (e: any) {
    console.error("Submit wallet error:", e)
    return c.json({ data: null, error: { message: e.message || "Internal server error", code: "INTERNAL_ERROR" } }, 500)
  }
})

export default app
