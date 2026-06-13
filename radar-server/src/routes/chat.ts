import { Hono } from "hono"
import { askGemini } from "../services/gemini"

const app = new Hono()

app.post("/", async (c) => {
  try {
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

    const responseText = await askGemini(message, history || [])

    return c.json({
      data: responseText,
      error: null,
    })
  } catch (e: any) {
    console.error("Chat route error:", e)
    return c.json(
      {
        data: null,
        error: { message: e.message || "Internal server error", code: "INTERNAL_ERROR" },
      },
      500
    )
  }
})

export default app
