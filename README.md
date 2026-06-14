# Radar

> Instant token intelligence inside Telegram — built for SwiftyEx users.

Radar is a Telegram Mini App that gives crypto users instant token research, risk scoring, trending coins, and AI-powered crypto conversations without leaving Telegram.

---

## What it does

| Screen | What you get |
|---|---|
| **Research** | Paste any contract address or ticker — get price, liquidity, market cap, holder concentration, bundle detection, and a risk verdict |
| **Trending** | Live feed of trending tokens across all chains from DEXScreener |
| **AI Chat** | Ask anything crypto — powered by Gemini 2.5 Flash with a crypto-focused system prompt |

### Risk scoring

Radar runs a rules-based engine on every token lookup:

| Signal | Risk points |
|---|---|
| Liquidity < $50K | +30 |
| Top 10 holders > 40% supply | +25 |
| Bundle detected at launch | +35 |
| Token age < 24 hours | +15 |
| Smart money wallet present | −20 |

Scores map to verdicts: ✅ No major flags (0–30) · ⚠️ Proceed with caution (31–60) · 🚨 Rug signals detected (61–100)

---

## Repo structure

```
radar/
├── radar-app/        # React + Vite Telegram Mini App (deployed to Vercel)
├── radar-server/     # Bun + Hono REST API (deployed to Render)
├── CONVENTIONS.md    # Code style, naming, commit format, branching
├── TRD.md            # Tech stack decisions and architecture
├── PRD.md            # Product requirements and user flows
├── ERD.md            # Database schema
└── TICKETS.md        # Feature breakdown and task tracking
```

---

## Architecture

```
Telegram Client
      │
      ├── Mini App (React/Vite → Vercel)
      │         └── REST API calls (Authorization: tma <initData>)
      │                   │
      │              Bun + Hono Backend (Render)
      │                   │
      │         ┌─────────┼──────────────┐
      │    Upstash     Supabase      External APIs
      │    Redis        Postgres      ├── DEXScreener
      │    (cache)      (persist)     ├── Helius RPC
      │                               └── Gemini API
      │
      └── Bot (grammY — same Bun process)
                └── Price alert DMs
```

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Telegram SDK | @telegram-apps/sdk-react |
| Backend | Bun + Hono |
| Cache | Upstash Redis |
| Database | Supabase (PostgreSQL) |
| Price data | DEXScreener API |
| On-chain data | Helius RPC (Solana) |
| AI | Google Gemini 2.5 Flash |
| Bot | grammY |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Free accounts on: [Upstash](https://upstash.com), [Supabase](https://supabase.com), [Helius](https://helius.dev), [Google AI Studio](https://aistudio.google.com)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd radar

# Install frontend deps
cd radar-app && bun install

# Install backend deps
cd ../radar-server && bun install
```

### 2. Set up environment variables

```bash
# Frontend
cp radar-app/.env.example radar-app/.env

# Backend
cp radar-server/.env.example radar-server/.env
```

Fill in both `.env` files — see each package's README for details.

### 3. Run database migrations

In your Supabase dashboard, open the SQL editor and run:

```
radar-server/src/db/migrations/001_init.sql
```

### 4. Start development

```bash
# Terminal 1 — backend
cd radar-server && bun --watch src/index.ts

# Terminal 2 — frontend
cd radar-app && bun run dev
```

Frontend runs at `http://localhost:5173`. Backend at `http://localhost:3001`.

---

## Deployment

| Service | Package | Command |
|---|---|---|
| Vercel | `radar-app` | Push to `main` — auto-deploys |
| Render | `radar-server` | Push to `main` — auto-deploys |

Set all environment variables in each platform's dashboard before deploying.

---

## Security notes

- Every backend request (except `/health`) validates the Telegram `initData` hash
- User identity is always extracted from validated init data — never trusted from request body
- Never commit `.env` files — use `.env.example` to share the required keys

---

## License

MIT