import { Hono } from "hono"
import tokenRoutes from "./routes/token"
import trendingRoutes from "./routes/trending"
import chatRoutes from "./routes/chat"
import alertRoutes from "./routes/alerts"
import walletRoutes from "./routes/wallets"

const app = new Hono()

const allowedOrigin = process.env.FRONTEND_URL || "*"

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", allowedOrigin === "*" ? "*" : (c.req.header("Origin") || "*"))
  c.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS")
  c.header("Access-Control-Allow-Headers", "*")
  if (c.req.method === "OPTIONS") {
    c.header("Access-Control-Max-Age", "86400")
    return c.newResponse(null, 204)
  }
  await next()
})

app.get("/health", (c) => c.json({ status: "ok", service: "radar-server" }))

app.route("/token", tokenRoutes)
app.route("/trending", trendingRoutes)
app.route("/chat", chatRoutes)
app.route("/alerts", alertRoutes)
app.route("/wallets", walletRoutes)

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
}

console.log("✅ Radar server running on port 3001")
