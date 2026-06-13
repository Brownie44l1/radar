# Epics & Tickets — Radar

## Build order (strict — do not skip ahead)
Foundation → Backend core → Frontend shell → Research feature → Trending → AI Chat → Alerts → Polish

---

## Epic 1 — Foundation
Everything else depends on this. Build first, build solid.

### RADAR-001 — Scaffold both projects
**Acceptance criteria:**
- `radar-app/` (React + Vite + Tailwind + Telegram SDK) initialised
- `radar-server/` (Bun + Hono) initialised
- Both run locally without errors
- `.env.example` files present in both
- Git repo initialised with `main` and `dev` branches

### RADAR-002 — Supabase setup + migrations
**Acceptance criteria:**
- Supabase project created
- All tables exist: users, alerts, smart_money_wallets, wallet_submissions
- All indexes applied
- Migration SQL file committed to repo

### RADAR-003 — Redis + cache helpers
**Acceptance criteria:**
- Upstash Redis connected
- `cacheGet<T>(key)` and `cacheSet(key, value, ttlSeconds)` helpers written
- TTL constants in `riskWeights.ts`
- Cache miss returns null without throwing

### RADAR-004 — Telegram Bot + Mini App registration
**Acceptance criteria:**
- Bot created via @BotFather
- Mini App URL registered (can be localhost via ngrok for now)
- Bot responds to /start with a button that opens the Mini App
- `Telegram.WebApp.ready()` called on Mini App load
- Telegram theme variables applied to frontend

---

## Epic 2 — Backend services

### RADAR-005 — DEXScreener service
**Acceptance criteria:**
- `searchTokens(query)` returns list of matches with address, symbol, chain, price, liquidity
- `getTokenData(address, chain)` returns full token data
- `getTrending()` returns top 20 trending tokens
- All responses cached per TTL constants
- Errors return null, never throw

### RADAR-006 — Helius service (Solana only)
**Acceptance criteria:**
- `getTopHolders(address)` returns top 10 holders + % of supply
- Result cached 30 minutes
- Graceful fallback if rate limit hit — returns null, frontend shows "holder data unavailable"

### RADAR-007 — Bundle detection
**Acceptance criteria:**
- `detectBundle(address)` checks first 50 txns at launch
- Returns true if 3+ wallets bought in same block from same SOL source
- Result cached indefinitely
- Only runs for Solana tokens — returns null for other chains

### RADAR-008 — Smart money service
**Acceptance criteria:**
- `checkSmartMoney(address)` cross-references token holders vs smart_money_wallets table
- Returns count + labels of matching wallets
- Seeded with at least 10 manually curated Solana wallets before demo
- Result cached 1 hour

### RADAR-009 — Risk score engine
**Acceptance criteria:**
- `computeRiskScore(signals)` returns score 0–100
- All weights in `constants/riskWeights.ts` — not hardcoded inline
- Returns verdict string: ✅ No major flags / ⚠️ Proceed with caution / 🚨 Rug signals detected
- Unit testable (pure function, no side effects)

### RADAR-010 — Gemini AI service
**Acceptance criteria:**
- `askGemini(message, history)` sends message + session history to Gemini API
- Uses gemini-2.5-flash model
- System prompt positions Gemini as a crypto research assistant aware of Radar's context
- Returns response text
- Errors return a fallback message — never crash

### RADAR-011 — API routes
**Acceptance criteria:**
- All 7 routes implemented and tested via curl/Postman
- Telegram init data validated on every request (security)
- CORS configured to allow frontend origin only
- All routes return consistent `{ data, error }` response shape

---

## Epic 3 — Frontend shell

### RADAR-012 — App shell + bottom navigation
**Acceptance criteria:**
- Three tabs: Research, Trending, AI Chat
- Active tab highlighted
- Telegram back button wired up
- Telegram theme (light/dark) applied via CSS variables
- Smooth tab transitions

### RADAR-013 — API client
**Acceptance criteria:**
- `api.ts` wraps all fetch calls with base URL + error handling
- Telegram init data attached to every request header
- Loading and error states handled consistently

---

## Epic 4 — Research feature

### RADAR-014 — Search + disambiguation UI
**Acceptance criteria:**
- Search bar on Research tab
- Detects if input is contract address (skip search, go direct) or ticker/name (search)
- Shows disambiguation list if multiple matches
- Each result shows: name, symbol, chain badge, price, liquidity
- Tapping result loads research card

### RADAR-015 — Research card UI
**Acceptance criteria:**
- Shows all fields from PRD card format
- RiskBadge component renders correct color + text per verdict
- Cache status tag shown ("⚡ Cached" or "✅ Live")
- Stale-while-revalidate: cached card shown instantly, updates when fresh data arrives
- Bundle + smart money rows hidden for non-Solana tokens (not shown as "N/A")
- "Set Alert" button present

---

## Epic 5 — Trending

### RADAR-016 — Trending tab UI
**Acceptance criteria:**
- List of 20 trending tokens
- Each row: rank, name, chain badge, price, 24h % change (green/red), volume
- Tapping row navigates to research card
- Pull-to-refresh supported
- Cached for 5 minutes with visible timestamp

---

## Epic 6 — AI Chat

### RADAR-017 — AI Chat UI
**Acceptance criteria:**
- Chat interface with message bubbles (user right, AI left)
- Input bar fixed to bottom
- Loading indicator while Gemini responds
- Session history maintained (resets on app close)
- Suggested prompts shown on empty state: "Is $WIF risky?", "What is liquidity?", "Explain rug pulls"
- Error state if Gemini API fails: "AI unavailable — try again"

---

## Epic 7 — Alerts + wallet submission

### RADAR-018 — Price alert flow
**Acceptance criteria:**
- "Set Alert" opens modal with current price shown
- User inputs target price
- Direction (above/below) auto-detected vs current price
- Alert saved to Supabase
- Bot DMs user when alert fires
- Background poller runs every 30 seconds

### RADAR-019 — Wallet submission
**Acceptance criteria:**
- "Submit Wallet" accessible from Research tab
- Validates input is valid Solana public key format
- Saves to wallet_submissions table
- Confirms: "Submitted — we'll review and add if it qualifies"
- Duplicate submission by same user rejected gracefully

---

## Epic 8 — Polish (only if time allows)

### RADAR-020 — Loading skeletons
Replace all blank states with skeleton loaders for research card and trending list.

### RADAR-021 — Mock data fallback
If DEXScreener or Helius is down during demo, bot falls back to static mock data silently.

### RADAR-022 — Haptic feedback
Use Telegram.WebApp.HapticFeedback on key interactions (alert set, search submit).

---

## Priority if time runs out
Must have: RADAR-001 to RADAR-015 (foundation + research card)
Should have: RADAR-016 (trending) + RADAR-017 (AI chat)
Nice to have: RADAR-018 to RADAR-022
