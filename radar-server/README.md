# radar-server

Bun + Hono REST API for Radar. Handles token research, risk scoring, price alerts, and AI chat.

---

## Overview

A lightweight REST API built on [Bun](https://bun.sh) and [Hono](https://hono.dev). It sits between the Mini App frontend and external services (DEXScreener, Helius, Supabase, Upstash Redis, Gemini). All routes follow a consistent `{ data, error }` response envelope.

---

## Project structure

```
src/
├── routes/
│   ├── token.ts       # GET /token/:address, GET /token/search/:query
│   ├── trending.ts    # GET /trending
│   ├── alerts.ts      # POST /alerts, DELETE /alerts/:id
│   ├── chat.ts        # POST /chat
│   └── wallets.ts     # POST /wallets/submit
├── services/
│   ├── dexscreener.ts # DEXScreener API client
│   ├── helius.ts      # Helius RPC — top holder data
│   ├── bundleDetect.ts# Bundle detection via Helius Enhanced API
│   ├── smartMoney.ts  # Smart money wallet matching
│   ├── riskScore.ts   # Rules-based risk scoring engine (pure function)
│   └── gemini.ts      # Gemini API client for AI chat
├── cache/
│   └── redis.ts       # Upstash Redis helpers (cacheGet, cacheSet)
├── db/
│   ├── client.ts      # Supabase client (lazy init, graceful fallback)
│   └── migrations/
│       └── 001_init.sql
├── constants/
│   └── riskWeights.ts # Risk weights, thresholds, verdicts, cache TTLs
├── types/
│   └── index.ts       # Shared TypeScript types
└── index.ts           # Hono app init + route registration
```

---

## API routes

All routes return:

```typescript
// Success
{ data: T, error: null }

// Failure
{ data: null, error: { message: string, code: string } }
```

| Method | Route | Auth required | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/token/:address` | Yes | Full research card by contract address |
| GET | `/token/search/:query` | No | Search tokens by name or ticker |
| GET | `/trending` | No | Trending tokens from DEXScreener |
| POST | `/chat` | No | Send message to Gemini, receive response |
| POST | `/alerts` | Yes | Create a price alert |
| DELETE | `/alerts/:id` | Yes | Cancel a price alert |
| POST | `/wallets/submit` | Yes | Submit a smart money wallet for review |

Routes marked **Auth required** validate the Telegram `initData` HMAC on every request.

---

## Environment variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

| Variable | Where to get it | Required |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) → your bot → API Token | Yes |
| `HELIUS_API_KEY` | [helius.dev](https://helius.dev) → Dashboard → API Keys | Yes |
| `UPSTASH_REDIS_URL` | [upstash.com](https://upstash.com) → Database → REST API | Yes |
| `UPSTASH_REDIS_TOKEN` | Same as above | Yes |
| `SUPABASE_URL` | [supabase.com](https://supabase.com) → Project → Settings → API | Yes |
| `SUPABASE_ANON_KEY` | Same as above | Yes |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API Key | Yes |
| `FRONTEND_URL` | Your deployed Vercel URL | Yes (production) |
| `PORT` | Port for the HTTP server | No (default: 3001) |
| `NODE_ENV` | `development` or `production` | No (default: development) |

---

## Setup and running

### Install dependencies

```bash
bun install
```

### Run database migrations

In your Supabase dashboard, open the SQL editor and run the contents of:

```
src/db/migrations/001_init.sql
```

This creates the `users`, `alerts`, `smart_money_wallets`, and `wallet_submissions` tables with indexes.

### Start the server

```bash
# Development (with file watching)
bun --watch src/index.ts

# Production
bun src/index.ts
```

Server starts on `http://localhost:3001` (or `$PORT`).

---

## Services

### DEXScreener (`services/dexscreener.ts`)

Fetches token price, liquidity, market cap, volume, and 24h change. Used for token lookups, search, and trending. No API key required.

Cache TTLs: price data 30s · trending 5 minutes.

### Helius (`services/helius.ts` + `services/bundleDetect.ts`)

Two Helius integrations:

- `getTopHolders` — calls `getTokenSupply` and `getTokenLargestAccounts` via Helius RPC to get the top 10 holder percentage
- `detectBundle` — calls `getSignaturesForAddress` then the Helius Enhanced Transactions API to check whether 3+ wallets with the same funding source bought in the same block at launch

Cache TTLs: holders 30 minutes · bundle detection indefinite (launch state never changes).

### Risk score engine (`services/riskScore.ts`)

A pure function — no side effects, no I/O. Takes a `RiskSignals` object, applies weighted rules from `constants/riskWeights.ts`, clamps to 0–100, and returns `{ score, verdict }`. Easy to unit test.

### Gemini (`services/gemini.ts`)

Calls `gemini-2.5-flash` via the REST API with a crypto-focused system prompt. Passes full conversation history for multi-turn context.

### Smart money (`services/smartMoney.ts`)

Gets the top 10 holders of a token (via Helius), then cross-references them against the `smart_money_wallets` table in Supabase. Returns matches with labels.

---

## Cache strategy

All caching goes through `cache/redis.ts` helpers that wrap Upstash Redis. The pattern is consistent across every service:

```
1. Check Redis → cache hit → return immediately
2. Cache miss → call external API → store in Redis with TTL → return
```

| Data | TTL |
|---|---|
| Token price | 30 seconds |
| Trending tokens | 5 minutes |
| Holder distribution | 30 minutes |
| Smart money match | 1 hour |
| Bundle detection | No expiry |

---

## Auth

All routes (except `/health`) validate the Telegram `initData` HMAC using the bot token before processing the request. The validation is in `routes/alerts.ts` (`getTelegramUser`) and imported by `routes/wallets.ts` and `routes/chat.ts`.

---

## Deployment (Render)

1. Connect the monorepo root to a Render Blueprint or use a root `package.json` with `postinstall: cd radar-server && bun install`
2. Set the start command to `bun src/index.ts` in the `radar-server/` directory
3. Add all environment variables in Render's Environment tab
4. Set `FRONTEND_URL` to your Vercel deployment URL for CORS
5. Push to `main` — Render auto-deploys

Health check endpoint: `GET /health` → `{ status: "ok", service: "radar-server" }`