#!/bin/bash
# Radar v2 — full project scaffold
# Run from empty directory: bash SCAFFOLD.sh

set -e
echo "🚀 Scaffolding Radar..."

# ─── BACKEND (Bun + Hono) ────────────────────────────────────────────────────
echo "📦 Setting up radar-server..."
mkdir -p radar-server
cd radar-server

bun init -y

bun add hono @upstash/redis @supabase/supabase-js grammy @anthropic-ai/sdk

mkdir -p src/routes src/services src/cache src/db/migrations src/jobs src/bot src/constants src/types

# Entry point
cat > src/index.ts << 'ENTRY'
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
ENTRY

# Types
cat > src/types/index.ts << 'TYPES'
export interface TokenData {
  address: string
  symbol: string
  name: string
  chain: string
  price: number
  liquidity: number
  marketCap: number
  volume24h: number
  priceChange24h: number
  cachedAt: number
}

export interface HolderData {
  topHolderPercent: number
  topHolders: { address: string; percent: number }[]
}

export interface RiskSignals {
  liquidity: number
  topHolderPercent: number
  bundleDetected: boolean
  tokenAgeHours: number
  smartMoneyCount: number
}

export interface ResearchCard {
  tokenData: TokenData
  holderData: HolderData | null
  bundleDetected: boolean | null
  smartMoneyMatches: { address: string; label: string }[]
  riskScore: number
  verdict: string
  isLive: boolean
}

export interface ApiResponse<T> {
  data: T | null
  error: { message: string; code: string } | null
}
TYPES

# Constants
cat > src/constants/riskWeights.ts << 'WEIGHTS'
export const RISK_WEIGHTS = {
  LOW_LIQUIDITY: 30,
  HIGH_HOLDER_CONCENTRATION: 25,
  BUNDLE_DETECTED: 35,
  VERY_NEW_TOKEN: 15,
  SMART_MONEY_PRESENT: -20,
} as const

export const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
} as const

export const CACHE_TTL = {
  PRICE: 30,
  LIQUIDITY: 120,
  HOLDERS: 1800,
  SMART_MONEY: 3600,
  BUNDLE: 0,
  TRENDING: 300,
} as const

export const RISK_VERDICTS = {
  LOW: "✅ No major flags",
  MEDIUM: "⚠️ Proceed with caution",
  HIGH: "🚨 Rug signals detected",
} as const
WEIGHTS

# Redis cache helpers
cat > src/cache/redis.ts << 'REDIS'
import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    if (ttlSeconds === 0) {
      await redis.set(key, value)
    } else {
      await redis.set(key, value, { ex: ttlSeconds })
    }
  } catch (e) {
    console.error("Cache set failed:", e)
  }
}
REDIS

# Supabase client
cat > src/db/client.ts << 'DB'
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
DB

# Risk score service
cat > src/services/riskScore.ts << 'RISK'
import { RISK_WEIGHTS, RISK_THRESHOLDS, RISK_VERDICTS } from "../constants/riskWeights"
import type { RiskSignals } from "../types"

export function computeRiskScore(signals: RiskSignals): { score: number; verdict: string } {
  let score = 0

  if (signals.liquidity < 50_000) score += RISK_WEIGHTS.LOW_LIQUIDITY
  if (signals.topHolderPercent > 40) score += RISK_WEIGHTS.HIGH_HOLDER_CONCENTRATION
  if (signals.bundleDetected) score += RISK_WEIGHTS.BUNDLE_DETECTED
  if (signals.tokenAgeHours < 24) score += RISK_WEIGHTS.VERY_NEW_TOKEN
  if (signals.smartMoneyCount > 0) score += RISK_WEIGHTS.SMART_MONEY_PRESENT

  score = Math.max(0, Math.min(100, score))

  const verdict =
    score <= RISK_THRESHOLDS.LOW
      ? RISK_VERDICTS.LOW
      : score <= RISK_THRESHOLDS.MEDIUM
      ? RISK_VERDICTS.MEDIUM
      : RISK_VERDICTS.HIGH

  return { score, verdict }
}
RISK

# Route stubs
for route in token trending chat alerts wallets; do
cat > src/routes/${route}.ts << ROUTE
import { Hono } from "hono"
const app = new Hono()
app.get("/", (c) => c.json({ data: null, error: { message: "Not implemented", code: "NOT_IMPLEMENTED" } }))
export default app
ROUTE
done

# DB migration
cat > src/db/migrations/001_init.sql << 'SQL'
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  first_seen TIMESTAMP DEFAULT now(),
  last_active TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  token_chain TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  direction TEXT CHECK (direction IN ('above','below')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  fired_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS smart_money_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'solana',
  verified BOOLEAN DEFAULT false,
  added_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by BIGINT REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  chain TEXT DEFAULT 'solana',
  reason TEXT,
  submitted_at TIMESTAMP DEFAULT now(),
  reviewed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_money_addr ON smart_money_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_submissions_pending ON wallet_submissions(reviewed) WHERE reviewed = false;
SQL

# .env.example
cat > .env.example << 'ENV'
TELEGRAM_BOT_TOKEN=
HELIUS_API_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
ENV

# package.json scripts
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.scripts = {
  dev: 'bun --watch src/index.ts',
  start: 'bun src/index.ts',
  test: 'bun test'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

cd ..

# ─── FRONTEND (React + Vite + Tailwind) ──────────────────────────────────────
echo "🎨 Setting up radar-app..."

bunx create-vite radar-app --template react-ts --yes 2>/dev/null || {
  mkdir -p radar-app
  cd radar-app
  bun init -y
  cd ..
}

cd radar-app

bun add @telegram-apps/sdk-react @telegram-apps/sdk react-router-dom
bun add -d tailwindcss postcss autoprefixer @types/react @types/react-dom

mkdir -p src/pages src/components src/hooks src/lib src/types

# Types (shared with server)
cat > src/types/index.ts << 'TYPES'
export interface TokenData {
  address: string
  symbol: string
  name: string
  chain: string
  price: number
  liquidity: number
  marketCap: number
  volume24h: number
  priceChange24h: number
  cachedAt: number
}

export interface ResearchCard {
  tokenData: TokenData
  holderData: { topHolderPercent: number } | null
  bundleDetected: boolean | null
  smartMoneyMatches: { address: string; label: string }[]
  riskScore: number
  verdict: string
  isLive: boolean
}

export interface TrendingToken {
  address: string
  symbol: string
  name: string
  chain: string
  price: number
  priceChange24h: number
  volume24h: number
}
TYPES

# API client
cat > src/lib/api.ts << 'API'
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    })
    const json = await res.json()
    if (json.error) { console.error(json.error); return null }
    return json.data
  } catch (e) {
    console.error("API error:", e)
    return null
  }
}

export const api = {
  searchToken: (query: string) => request(`/token/search/${encodeURIComponent(query)}`),
  getToken: (address: string) => request(`/token/${address}`),
  getTrending: () => request("/trending"),
  chat: (message: string, history: { role: string; content: string }[]) =>
    request("/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
  setAlert: (tokenAddress: string, targetPrice: number) =>
    request("/alerts", { method: "POST", body: JSON.stringify({ tokenAddress, targetPrice }) }),
  submitWallet: (walletAddress: string, reason?: string) =>
    request("/wallets/submit", { method: "POST", body: JSON.stringify({ walletAddress, reason }) }),
}
API

# Page stubs
for page in Research Trending AIChat; do
cat > src/pages/${page}.tsx << PAGE
export default function ${page}() {
  return <div style={{ padding: "1rem" }}>${page} — coming soon</div>
}
PAGE
done

# BottomNav component
cat > src/components/BottomNav.tsx << 'NAV'
interface Props {
  active: "research" | "trending" | "chat"
  onTab: (tab: "research" | "trending" | "chat") => void
}

export default function BottomNav({ active, onTab }: Props) {
  const tabs = [
    { id: "research" as const, label: "Research", icon: "🔍" },
    { id: "trending" as const, label: "Trending", icon: "🔥" },
    { id: "chat" as const, label: "AI Chat", icon: "🤖" },
  ]
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      display: "flex", borderTop: "1px solid var(--tg-theme-hint-color, #ccc)",
      background: "var(--tg-theme-bg-color, #fff)"
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          flex: 1, padding: "10px 0", border: "none", background: "transparent",
          opacity: active === t.id ? 1 : 0.5, cursor: "pointer",
          fontSize: "11px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px"
        }}>
          <span style={{ fontSize: "20px" }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
NAV

# App.tsx
cat > src/App.tsx << 'APP'
import { useState, useEffect } from "react"
import BottomNav from "./components/BottomNav"
import Research from "./pages/Research"
import Trending from "./pages/Trending"
import AIChat from "./pages/AIChat"

type Tab = "research" | "trending" | "chat"

export default function App() {
  const [tab, setTab] = useState<Tab>("research")

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }
  }, [])

  return (
    <div style={{ paddingBottom: "60px", minHeight: "100vh", background: "var(--tg-theme-bg-color, #fff)" }}>
      {tab === "research" && <Research />}
      {tab === "trending" && <Trending />}
      {tab === "chat" && <AIChat />}
      <BottomNav active={tab} onTab={setTab} />
    </div>
  )
}
APP

# .env.example
cat > .env.example << 'ENV'
VITE_API_URL=http://localhost:3001
VITE_BOT_USERNAME=
ENV

# .gitignore
cat > .gitignore << 'GIT'
node_modules/
dist/
.env
*.log
GIT

# package.json scripts
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.scripts = {
  ...pkg.scripts,
  dev: 'vite',
  build: 'tsc && vite build',
  preview: 'vite preview'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

cd ../..

# ─── ROOT README ─────────────────────────────────────────────────────────────
cat > radar/README.md << 'README'
# Radar

> Research layer for the SwiftyEx ecosystem. Instant token intelligence inside Telegram.

## Projects
- `radar-app/` — Telegram Mini App (React + Vite + TypeScript)
- `radar-server/` — Backend API (Bun + Hono + TypeScript)

## Quick start

### Backend
```bash
cd radar-server
cp .env.example .env   # fill in your keys
bun dev
```

### Frontend
```bash
cd radar-app
cp .env.example .env   # fill in VITE_API_URL
bun dev
```

## Services required
| Service | Purpose | Link |
|---|---|---|
| Telegram Bot | Mini App entry point | @BotFather |
| Helius | Solana holder + bundle data | helius.dev |
| Upstash | Redis cache | upstash.com |
| Supabase | Postgres database | supabase.com |
| Anthropic | AI chat | console.anthropic.com |

## Deploy
- Frontend → Vercel (connect radar-app/ folder)
- Backend → Railway (connect radar-server/ folder)

## Ticket order
See TICKETS.md — build RADAR-001 through RADAR-015 first.
README

echo ""
echo "✅ Radar scaffolded successfully!"
echo ""
echo "Next steps:"
echo "  1. cd radar/radar-server && cp .env.example .env"
echo "  2. cd radar/radar-app && cp .env.example .env"
echo "  3. Fill in all API keys"
echo "  4. Run migration SQL in Supabase dashboard"
echo "  5. cd radar-server && bun dev"
echo "  6. cd radar-app && bun dev"
echo "  7. Start with RADAR-001"