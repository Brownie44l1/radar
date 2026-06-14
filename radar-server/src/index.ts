import { Hono } from "hono"
import tokenRoutes from "./routes/token"
import trendingRoutes from "./routes/trending"
import chatRoutes from "./routes/chat"
import alertRoutes from "./routes/alerts"
import walletRoutes from "./routes/wallets"
import { startBot, startAlertPoller } from "./bot/index"

const app = new Hono()

const rawAllowed = process.env.FRONTEND_URL || "*"
const allowedOrigin = rawAllowed.replace(/\/$/, "")

app.use("*", async (c, next) => {
  const origin = (c.req.header("Origin") || "*").replace(/\/$/, "")
  const allowed = allowedOrigin === "*" ? "*" : (origin === allowedOrigin ? origin : "")

  c.header("Access-Control-Allow-Origin", allowed || allowedOrigin)
  c.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS")
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  c.header("Access-Control-Max-Age", "86400")

  if (c.req.method === "OPTIONS") {
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

const port = process.env.PORT || 3001

console.log(`✅ Radar server running on port ${port}`)

startBot()
startAlertPoller()

export default {
  port,
  fetch: app.fetch,
}
