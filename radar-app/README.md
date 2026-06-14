# radar-app

React + Vite Telegram Mini App for Radar — the frontend that runs inside Telegram.

---

## Overview

This is a Telegram Mini App (TMA) — a web app that runs inside the Telegram client. It communicates with `radar-server` for all data and uses the Telegram WebApp SDK for native features like haptic feedback, the back button, and theme variables.

---

## Project structure

```
src/
├── pages/
│   ├── Research.tsx      # Token search + research card view
│   ├── Trending.tsx      # Trending tokens list
│   └── AIChat.tsx        # AI conversation screen
├── components/
│   ├── ResearchCard.tsx  # Token research card with risk verdict
│   ├── AlertModal.tsx    # Price alert modal
│   ├── WalletModal.tsx   # Submit smart money wallet modal
│   ├── SearchBar.tsx     # Token search input
│   ├── BottomNav.tsx     # Tab navigation bar
│   ├── RiskBadge.tsx     # Risk verdict badge (green/amber/red)
│   └── Icon.tsx          # Material Symbols icon wrapper
├── lib/
│   └── api.ts            # Typed backend API client
├── types/
│   └── index.ts          # Shared TypeScript types
├── App.tsx               # Root component — routing + Telegram SDK init
├── main.tsx              # Entry point — theme variables injection
└── index.css             # Global styles + Tailwind base
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the radar-server backend | `https://radar-exg4.onrender.com` |
| `VITE_BOT_USERNAME` | Telegram bot username (without @) | `RadarSwiftyBot` |

For local development, `VITE_API_URL` defaults to `http://localhost:3001`.

---

## Setup

```bash
bun install
bun run dev
```

The app runs at `http://localhost:5173`.

### Telegram Mini App local testing

Telegram requires HTTPS for Mini Apps in production, but for local development you can use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 5173
```

Set the ngrok HTTPS URL as the Mini App URL in @BotFather under **Bot Settings → Mini App → Edit Mini App URL**.

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with HMR |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint |

---

## How Telegram integration works

### Initialization (`main.tsx`)

On load, the app reads `window.Telegram.WebApp.themeParams` and injects them as CSS variables (`--tg-theme-bg-color`, `--tg-theme-text-color`, etc.) so the UI respects the user's Telegram light/dark theme.

### Back button (`App.tsx`)

The Telegram back button is wired up in `App.tsx`. It dispatches a custom `tma-back-button` DOM event that `Research.tsx` listens to — pressing the Telegram back button navigates from a research card back to the search view.

### Auth (`lib/api.ts`)

Every API request includes the Telegram `initData` string in the `Authorization` header:

```
Authorization: tma <initData>
```

The backend validates the HMAC hash of this data against the bot token on every request.

---

## Caching pattern

The app implements stale-while-revalidate for token research cards:

1. Request arrives → server checks Redis
2. Cache hit → returns immediately with `isLive: false`, triggers background refresh
3. Frontend shows "⚡ Cached · Refreshing..."
4. Background fetch completes → card updates, shows "✅ Live"
5. Cache miss → fetches live data, populates cache, returns

---

## Deployment (Vercel)

1. Connect the `radar-app` folder to a Vercel project
2. Set `VITE_API_URL` and `VITE_BOT_USERNAME` in Vercel environment variables
3. Push to `main` — Vercel auto-deploys

The deployed HTTPS URL is what you set in @BotFather as the Mini App URL.