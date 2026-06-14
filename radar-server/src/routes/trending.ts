import { Hono } from "hono"
import { getTrending } from "../services/dexscreener"

const app = new Hono()

app.get("/", async (c) => {
  try {
    const tokens = await getTrending()
    return c.json({
      data: tokens || [],
      error: null,
    })
  } catch (e: unknown) {
    console.error("Trending route error:", e)
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
