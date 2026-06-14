# TRD — Radar

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | Telegram Mini Apps are web apps — React is the fastest to build UI in solo. Vite is instant HMR. |
| UI library | Tailwind CSS | Utility-first, no design system to configure, works great with Telegram's dark/light theme |
| Telegram SDK | @telegram-apps/sdk-react | Official Telegram Mini App SDK for React. Handles init data, theme, back button, haptics |
| Backend | Bun + Hono | Bun is faster than Node, built-in TypeScript, no tsconfig needed. Hono is lightweight REST framework built for Bun. CORS middleware is built into Hono core (`hono/cors`) — no separate package needed |
| Cache | Redis via Upstash | Free tier, TTL per key, stale-while-revalidate pattern |
| Database | PostgreSQL via Supabase | Free tier — alerts, smart money list, wallet submissions, users |
| Hosting (frontend) | Vercel | Free tier, instant deploys from git, HTTPS out of the box (required for Mini Apps) |
| Hosting (backend) | Render | Free tier, supports always-on Bun processes via root `package.json` |
| Price / liquidity | DEXScreener API | Free, no API key, supports all major chains + Solana |
| On-chain data | Helius RPC (Solana) | Free tier — holder data, bundle detection |
| AI chat | Anthropic Claude API (claude-haiku-3-5) | Cheapest Claude model, fast responses, more than capable for crypto Q&A |
| Bot layer | grammY + Bun | Telegram bot handles price alert DMs — Mini App is the UI layer |

## Why Bun over Node
- Built-in TypeScript — no tsx, ts-node, or tsconfig needed
- Faster install (bun install vs npm install — 10-20x)
- Built-in .env loading — no dotenv package
- `bun --watch` replaces nodemon/tsx watch
- Same npm ecosystem — all packages compatible

## Architecture overview
```
Telegram Client
      │
      ├── Mini App (React/Vite → Vercel)
      │         │
      │         └── REST API calls
      │                   │
      │              Bun + Hono Backend (Render)
      │                   │
      │         ┌─────────┼──────────────┐
      │         │         │              │
      │    Upstash     Supabase      External APIs
      │    Redis        Postgres      │
      │    (cache)      (persist)     ├── DEXScreener
      │                               ├── Helius RPC
      │                               └── Claude API
      │
      └── Bot (grammY — same Bun process as backend)
                │
                └── Price alert DMs to user
```

## Frontend structure
```
radar-app/                         # Mini App (React)
├── src/
│   ├── pages/
│   │   ├── Research.tsx           # token search + research card
│   │   ├── Trending.tsx           # trending tokens list
│   │   └── AIChat.tsx             # AI conversation screen
│   ├── components/
│   │   ├── ResearchCard.tsx       # token card component
│   │   ├── RiskBadge.tsx          # verdict badge (green/amber/red)
│   │   ├── TokenRow.tsx           # trending list row
│   │   ├── ChatBubble.tsx         # AI chat message bubble
│   │   ├── SearchBar.tsx          # token search input
│   │   ├── BottomNav.tsx          # tab navigation
│   │   └── AlertModal.tsx         # price alert modal
│   ├── hooks/
│   │   ├── useToken.ts            # fetch + cache token data
│   │   ├── useTrending.ts         # fetch trending tokens
│   │   └── useChat.ts             # AI chat state management
│   ├── lib/
│   │   ├── api.ts                 # backend API client
│   │   └── telegram.ts            # Telegram SDK helpers
│   ├── types/
│   │   └── index.ts               # shared types
│   ├── App.tsx                    # router + bottom nav
│   └── main.tsx                   # entry point
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## Backend structure
```
radar-server/                      # Bun + Hono backend
├── src/
│   ├── routes/
│   │   ├── token.ts               # GET /token/:address, GET /token/search/:query
│   │   ├── trending.ts            # GET /trending
│   │   ├── alerts.ts              # POST/DELETE /alerts
│   │   ├── chat.ts                # POST /chat
│   │   └── wallets.ts             # POST /wallets/submit
│   ├── services/
│   │   ├── dexscreener.ts         # DEXScreener API client
│   │   ├── helius.ts              # Helius RPC client
│   │   ├── bundleDetect.ts        # bundle detection logic
│   │   ├── smartMoney.ts          # smart money wallet matching
│   │   ├── riskScore.ts           # risk score engine
│   │   └── claude.ts              # Claude API client
│   ├── cache/
│   │   └── redis.ts               # Upstash Redis helpers
│   ├── db/
│   │   ├── client.ts              # Supabase client
│   │   └── migrations/            # .sql files
│   ├── jobs/
│   │   └── alertPoller.ts         # background alert polling
│   ├── bot/
│   │   └── index.ts               # grammY bot (alert DMs)
│   ├── constants/
│   │   └── riskWeights.ts         # risk weights + cache TTLs
│   ├── types/
│   │   └── index.ts               # shared types
│   └── index.ts                   # Hono app init + route registration
├── .env.example
└── package.json
```

## API routes
| Method | Route | Description |
|---|---|---|
| GET | /token/:address | Fetch token research card by contract address |
| GET | /token/search/:query | Search token by ticker or name |
| GET | /trending | Fetch trending tokens |
| POST | /chat | Send message to Claude, get response |
| POST | /alerts | Create price alert |
| DELETE | /alerts/:id | Cancel alert |
| POST | /wallets/submit | Submit smart money wallet |

## Cache TTL strategy
| Data | TTL |
|---|---|
| Token price | 30 seconds |
| Liquidity / volume | 2 minutes |
| Holder distribution | 30 minutes |
| Smart money match | 1 hour |
| Bundle detection | indefinite |
| Trending tokens | 5 minutes |

## Caching pattern — Stale-While-Revalidate
1. Request arrives → check Redis
2. Cache hit → return immediately, trigger background refresh
3. Frontend receives cached data, shows "⚡ Cached" tag
4. Background fetch completes → frontend polls or receives update → shows "✅ Live"
5. Cache miss → fetch live → populate cache → return

## Telegram Mini App requirements
- Must be served over HTTPS → Vercel handles this
- Must implement Telegram.WebApp.ready() on load
- Must respect Telegram theme (light/dark) via CSS variables
- Bot must be registered and Mini App URL set via @BotFather

## Environment variables
```
# Backend (.env)
TELEGRAM_BOT_TOKEN=
HELIUS_API_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
FRONTEND_URL=

# Frontend (.env)
VITE_API_URL=
VITE_BOT_USERNAME=
```

## Free tier limits
| Service | Free limit | Risk at hackathon scale |
|---|---|---|
| Helius | 100k credits/mo | ~10 credits per lookup → ~10k lookups/mo. Safe |
| Upstash Redis | 10k commands/day | ~4 commands per lookup → ~2.5k lookups/day. Safe |
| Supabase | 500MB storage, 50k rows | Not a concern |
| Vercel | 100GB bandwidth | Not a concern |
| Render | Free tier | Monitor — may need upgrade for sustained use |
| Gemini (Google AI) | Free tier (60 req/min) | gemini-2.5-flash is fast and free for the demo |
| DEXScreener | Unlimited (unofficial) | No documented rate limit. Have mock data as fallback |