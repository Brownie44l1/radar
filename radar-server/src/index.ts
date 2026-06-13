import { Hono } from "hono"
import { cors } from "hono/cors"
import tokenRoutes from "./routes/token"
import trendingRoutes from "./routes/trending"
import chatRoutes from "./routes/chat"
import alertRoutes from "./routes/alerts"
import walletRoutes from "./routes/wallets"

const app = new Hono()

app.use("*", cors({ origin: process.env.FRONTEND_URL || "*" }))

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
