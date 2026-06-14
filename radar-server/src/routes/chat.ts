import { Hono } from "hono"
import { askGemini } from "../services/gemini"
import { getTelegramUser } from "./alerts"
import { rateLimit } from "../lib/rateLimit"

const app = new Hono()

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

    const { allowed, remaining, resetAt } = rateLimit(`chat:${user.id}`, 10, 60)
    if (!allowed) {
      return c.json(
        {
          data: null,
          error: {
            message: `Rate limit exceeded. Try again in ${Math.ceil((resetAt - Date.now()) / 1000)}s`,
            code: "RATE_LIMITED",
          },
        },
        429
      )
    }

    const { message, history } = await c.req.json()

    if (!message) {
      return c.json(
        {
          data: null,
          error: { message: "Message is required", code: "VALIDATION_ERROR" },
        },
        400
      )
    }

    if (typeof message !== "string" || message.length > 2000) {
      return c.json(
        {
          data: null,
          error: { message: "Message must be under 2000 characters", code: "VALIDATION_ERROR" },
        },
        400
      )
    }

    const responseText = await askGemini(message, history || [])

    return c.json({
      data: responseText,
      error: null,
    })
  } catch (e: unknown) {
    console.error("Chat route error:", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    return c.json(
      {
        data: null,
        error: { message, code: "INTERNAL_ERROR" },
      },
      500
    )
  }
})

export default app
