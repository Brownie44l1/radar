# PRD — Radar

> Research layer for the SwiftyEx ecosystem. Instant token intelligence inside Telegram.

## One-liner
Radar is a Telegram Mini App that gives SwiftyEx users instant token research, risk scoring, trending coins, and AI-powered crypto conversations — so they make informed trades without leaving Telegram.

## User
A Nigerian crypto user already using SwiftyEx on Telegram. Buys BTC, ETH, USDT for value preservation or remittance — but also explores altcoins and Solana tokens. Values speed, simplicity, and not getting rugged. Not necessarily technical.

## Problem
SwiftyEx users have no research layer inside Telegram. Before buying a token they either guess, ask in group chats, or tab-switch to DEXScreener, CoinGecko, and Twitter. Radar eliminates that context switch — research lives where trading already happens.

## What we're building
A Telegram Mini App with three screens:
1. **Research** — paste or search any token, get an instant research card with risk verdict
2. **Trending** — live feed of trending tokens across chains
3. **AI Chat** — ask anything about crypto, get an intelligent answer powered by Claude

## Core user flows (happy path only)

### Flow 1 — Token research card
1. User opens Radar Mini App from Telegram
2. User types a token name, ticker ($BONK), or contract address into search bar
3. If ticker → disambiguation list shown if multiple matches
4. User taps token from results
5. App shows cached card instantly tagged "⚡ Cached · Refreshing..."
6. Fresh data loads in background, card updates tagged "✅ Live"
7. Card shows: price, liquidity, mcap, top holder %, chain, bundle flag (Solana), smart money match, risk verdict

### Flow 2 — Trending coins
1. User taps Trending tab
2. App shows list of top trending tokens from DEXScreener (all chains)
3. Each row shows: token name, chain, price, 24h change, volume
4. User taps any token → opens research card (Flow 1)

### Flow 3 — AI chat
1. User taps AI Chat tab
2. User types a question: "Is $WIF a good buy right now?" or "Explain what liquidity means"
3. Claude API responds with concise, helpful answer
4. Conversation history persists for the session

### Flow 4 — Price alert
1. From any research card, user taps "Set Alert"
2. User inputs target price
3. Bot DMs user when price target is hit
4. Alert auto-cancels after firing

### Flow 5 — Submit smart money wallet
1. From settings or any research card, user taps "Submit Wallet"
2. User pastes wallet address
3. App confirms submission queued for review

## Research card format
```
🔍 $BONK — Bonk
Chain: Solana

💰 Price:         $0.000023
💧 Liquidity:     $1.2M
📊 Market Cap:    $23M
📈 24h Volume:    $4.1M
👥 Top 10 holders: 34% supply
🕐 Token age:     127 days

🧩 Bundle:        ✅ No bundles detected
🧠 Smart money:   2 known wallets holding

Verdict: ⚠️ Proceed with caution
Flags: Moderate holder concentration

✅ Live · updated just now
```

## Risk score engine (rules-based)
| Signal | Risk points |
|---|---|
| Liquidity < $50K | +30 |
| Top 10 holders > 40% supply | +25 |
| Bundle detected at launch | +35 |
| Token age < 24 hours | +15 |
| Smart money wallet present | -20 |

| Score | Verdict |
|---|---|
| 0–30 | ✅ No major flags |
| 31–60 | ⚠️ Proceed with caution |
| 61–100 | 🚨 Rug signals detected |

## Out of scope (v1)
- Trade execution → V3
- Auto smart money curation → V2
- Wallet PnL / transaction history → V2 (pending SwiftyEx API access)
- ML-based scoring → V4
- Portfolio tracking → out of scope
- Web dashboard → out of scope
- User authentication beyond Telegram identity → out of scope

## Judging criteria alignment
| Criteria | How Radar addresses it |
|---|---|
| Innovation & Creativity | AI chat + risk verdict inside Telegram is novel for Nigerian market |
| Technical Execution | Full stack: Mini App frontend + Bun backend + Redis + Supabase + Claude API |
| Product Quality | Three complete, polished screens |
| User Experience | Zero context switching — research lives where trading happens |
| Practical Relevance | Direct companion to SwiftyEx's stated roadmap |
| Presentation Quality | Live demo: paste token → card appears → ask AI about it |
