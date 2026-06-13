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
  } catch (e: any) {
    console.error("Trending route error:", e)
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
