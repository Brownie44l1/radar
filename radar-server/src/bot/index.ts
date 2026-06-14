import { Bot, InlineKeyboard, Keyboard } from "grammy"
import { supabase } from "../db/client"
import { getTokenData } from "../services/dexscreener"

interface ActiveAlert {
  id: string
  user_id: number
  token_address: string
  token_symbol: string | null
  token_chain: string
  target_price: number
  direction: "above" | "below"
  is_active: boolean
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const FRONTEND_URL = process.env.FRONTEND_URL || "https://radar.vercel.app"

if (!BOT_TOKEN) {
  console.warn("⚠️  TELEGRAM_BOT_TOKEN is not set — bot will not start")
}

export const bot = BOT_TOKEN ? new Bot(BOT_TOKEN) : null

const mainKeyboard = new Keyboard()
  .webApp("🔍 Open Radar", FRONTEND_URL)
  .row()
  .text("📊 Trending")
  .text("🤖 AI Chat")
  .row()
  .text("🔔 My Alerts")
  .text("ℹ️ Help")
  .resized()
  .persistent()

function getStartMessage(firstName: string): string {
  return (
    `👋 *Welcome to Radar, ${firstName}!*\n\n` +
    `Radar is your on-chain intelligence layer — scan any token for rug signals, ` +
    `track smart money wallets, and get AI-powered market insights, right inside Telegram.\n\n` +
    `*📋 What you can do:*\n\n` +
    `🔍 /scan \`<address or $SYMBOL>\` — Full token research card\n` +
    `📈 /trending — Top tokens by volume right now\n` +
    `🤖 /ask \`<question>\` — Ask the AI about any token\n` +
    `🔔 /alerts — View & manage your price alerts\n` +
    `💼 /wallets — Submit a smart money wallet\n` +
    `ℹ️ /help — Full command reference\n\n` +
    `_Tap *Open Radar* below to launch the full Mini App experience._`
  )
}

const startInlineKeyboard = new InlineKeyboard()
  .webApp("🚀 Open Radar", FRONTEND_URL)
  .row()
  .url("📖 Documentation", "https://github.com/your-org/radar")
  .url("🐦 Twitter / X", "https://twitter.com/yourhandle")
  .row()
  .text("📊 Show Trending", "trending")
  .text("ℹ️ Help", "help")

const BANNER_URL = process.env.RADAR_BANNER_URL || null

export function startBot() {
  if (!bot) return

  bot.command("start", async (ctx) => {
    const firstName = ctx.from?.first_name || "there"
    const text = getStartMessage(firstName)

    try {
      if (BANNER_URL) {
        await ctx.replyWithPhoto(BANNER_URL, {
          caption: text,
          parse_mode: "Markdown",
          reply_markup: startInlineKeyboard,
        })
      } else {
        await ctx.reply(text, {
          parse_mode: "Markdown",
          reply_markup: startInlineKeyboard,
        })
      }

      await ctx.reply(
        "Use the buttons below or type a command to get started.",
        { reply_markup: mainKeyboard }
      )
    } catch (e) {
      console.error("Error in /start handler:", e)
    }
  })

  bot.command("help", async (ctx) => {
    const helpText =
      `*📡 Radar — Command Reference*\n\n` +
      `*Research*\n` +
      `/scan \`<address>\` — Research card for any token\n` +
      `/scan \`$BONK\` — Search by ticker symbol\n\n` +
      `*Market*\n` +
      `/trending — Top 20 tokens by 24h volume\n\n` +
      `*AI*\n` +
      `/ask \`<question>\` — Ask the Radar AI anything\n` +
      `_Examples: "Is $WIF safe?", "What is a rug pull?", "Explain liquidity pools"\n\n_` +
      `*Alerts*\n` +
      `/alerts — View your active price alerts\n` +
      `/delalert \`<id>\` — Cancel a price alert\n\n` +
      `*Wallets*\n` +
      `/wallets — Submit a smart money wallet for tracking\n\n` +
      `*Other*\n` +
      `/start — Show welcome screen\n` +
      `/help — This message\n\n` +
      `_Or tap *Open Radar* to use the full Mini App._`

    await ctx.reply(helpText, {
      parse_mode: "Markdown",
      reply_markup: startInlineKeyboard,
    })
  })

  bot.command("trending", async (ctx) => {
    const msg = await ctx.reply("⏳ Fetching trending tokens...")

    try {
      const { getTrending } = await import("../services/dexscreener")
      const tokens = await getTrending()

      if (!tokens || tokens.length === 0) {
        await ctx.api.editMessageText(ctx.chat.id, msg.message_id, "❌ Could not load trending tokens right now. Try again in a moment.")
        return
      }

      const lines = tokens.slice(0, 10).map((t: { priceChange24h: number; symbol: string; price: number }, i: number) => {
        const change = t.priceChange24h >= 0 ? `+${t.priceChange24h.toFixed(1)}%` : `${t.priceChange24h.toFixed(1)}%`
        const emoji = t.priceChange24h >= 0 ? "🟢" : "🔴"
        return `${i + 1}. ${emoji} *$${t.symbol.toUpperCase()}* — $${t.price < 0.001 ? t.price.toExponential(2) : t.price.toFixed(4)} (${change})`
      })

      const trendingText =
        `📊 *Trending Tokens — Right Now*\n` +
        `_Source: DEXScreener • Updated live_\n\n` +
        lines.join("\n") +
        `\n\n_Tap Open Radar to see full research cards._`

      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, trendingText, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().webApp("🔍 Research a Token", FRONTEND_URL),
      })
    } catch (e) {
      console.error("Error in /trending handler:", e)
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, "❌ An error occurred. Please try again.")
    }
  })

  bot.command("scan", async (ctx) => {
    const query = ctx.match?.trim()

    if (!query) {
      await ctx.reply(
        "📍 Please provide a token address or ticker.\n\n*Examples:*\n`/scan $BONK`\n`/scan So11111111111111111111111111111111111111112`",
        { parse_mode: "Markdown" }
      )
      return
    }

    const msg = await ctx.reply(`🔍 Scanning *${query}*...`, { parse_mode: "Markdown" })

    try {
      const { searchTokens, getTokenData } = await import("../services/dexscreener")
      const { computeRiskScore } = await import("../services/riskScore")

      let tokenData = null

      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query)
      const isEvm = /^0x[a-fA-F0-9]{40}$/.test(query)

      if (isSolana || isEvm) {
        tokenData = await getTokenData(query, isSolana ? "solana" : "ethereum")
      } else {
        const symbol = query.replace(/^\$/, "")
        const results = await searchTokens(symbol)
        tokenData = results?.[0] || null
      }

      if (!tokenData) {
        await ctx.api.editMessageText(ctx.chat.id, msg.message_id, `❌ Could not find token: *${query}*`, { parse_mode: "Markdown" })
        return
      }

      const { score, verdict } = computeRiskScore({
        liquidity: tokenData.liquidity,
        topHolderPercent: 0,
        bundleDetected: false,
        tokenAgeHours: tokenData.pairCreatedAt ? (Date.now() - tokenData.pairCreatedAt) / 3_600_000 : 48,
        smartMoneyCount: 0,
      })

      const riskEmoji = score > 60 ? "🔴" : score > 30 ? "🟡" : "🟢"
      const changeEmoji = tokenData.priceChange24h >= 0 ? "📈" : "📉"
      const changeStr = tokenData.priceChange24h >= 0 ? `+${tokenData.priceChange24h.toFixed(1)}%` : `${tokenData.priceChange24h.toFixed(1)}%`

      const scanText =
        `${riskEmoji} *$${tokenData.symbol.toUpperCase()}* — ${tokenData.name}\n` +
        `\`${tokenData.chain.toUpperCase()}\`\n\n` +
        `💵 *Price:* $${tokenData.price < 0.00001 ? tokenData.price.toExponential(2) : tokenData.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}\n` +
        `${changeEmoji} *24h:* ${changeStr}\n` +
        `💧 *Liquidity:* $${tokenData.liquidity.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}\n` +
        `📦 *Market Cap:* $${tokenData.marketCap.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}\n` +
        `📊 *Volume 24h:* $${tokenData.volume24h.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}\n\n` +
        `${riskEmoji} *Risk Score:* ${score}/100 — *${verdict}*\n\n` +
        `_Tap below for the full on-chain research card including holder analysis, bundle detection & smart money._`

      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, scanText, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard()
          .webApp("🔬 Full Research Card", `${FRONTEND_URL}?token=${tokenData.address}&chain=${tokenData.chain}`)
          .row()
          .text("🔔 Set Price Alert", `alert:${tokenData.address}:${tokenData.chain}:${tokenData.symbol}`)
          .text("🤖 Ask AI", `askai:${tokenData.symbol}`),
      })
    } catch (e) {
      console.error("Error in /scan handler:", e)
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, "❌ An error occurred while scanning. Please try again.")
    }
  })

  bot.command("ask", async (ctx) => {
    const question = ctx.match?.trim()

    if (!question) {
      await ctx.reply(
        "🤖 Ask Radar AI anything about crypto.\n\n*Examples:*\n`/ask Is $WIF a safe buy?`\n`/ask What is a liquidity pool?`\n`/ask How do I detect a rug pull?`",
        { parse_mode: "Markdown" }
      )
      return
    }

    const msg = await ctx.reply("🤖 Thinking...")

    try {
      const { askGemini } = await import("../services/gemini")
      const answer = await askGemini(question, [])

      const answerText = `🤖 *Radar AI*\n\n_"${question}"_\n\n${answer}`

      const truncated = answerText.length > 4000 ? answerText.slice(0, 3997) + "..." : answerText

      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, truncated, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().webApp("💬 Continue in AI Chat", FRONTEND_URL),
      })
    } catch (e) {
      console.error("Error in /ask handler:", e)
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, "❌ AI is temporarily unavailable. Please try again.")
    }
  })

  bot.command("alerts", async (ctx) => {
    const userId = ctx.from?.id
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error || !data || data.length === 0) {
        await ctx.reply(
          "🔔 *Your Active Alerts*\n\nYou have no active price alerts.\n\nTap *Open Radar*, search a token, and tap *Set Alert* to create one.",
          {
            parse_mode: "Markdown",
            reply_markup: new InlineKeyboard().webApp("🔍 Open Radar", FRONTEND_URL),
          }
        )
        return
      }

      const lines = data.map((a: ActiveAlert, i: number) => {
        const dirEmoji = a.direction === "above" ? "⬆️" : "⬇️"
        return `${i + 1}. ${dirEmoji} *$${(a.token_symbol || "???").toUpperCase()}* — Alert when price goes ${a.direction} $${a.target_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}\n   ID: \`${a.id}\``
      })

      await ctx.reply(
        `🔔 *Your Active Alerts* (${data.length})\n\n` +
        lines.join("\n\n") +
        `\n\n_To cancel an alert:_ /delalert \`<id>\``,
        { parse_mode: "Markdown" }
      )
    } catch (e) {
      console.error("Error in /alerts handler:", e)
      await ctx.reply("❌ Could not load your alerts right now.")
    }
  })

  bot.command("delalert", async (ctx) => {
    const userId = ctx.from?.id
    const id = ctx.match?.trim()

    if (!userId || !id) {
      await ctx.reply("Usage: `/delalert <alert-id>`\n\nGet your alert IDs with /alerts", { parse_mode: "Markdown" })
      return
    }

    try {
      const { error } = await supabase
        .from("alerts")
        .update({ is_active: false })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) throw error

      await ctx.reply(`✅ Alert \`${id}\` has been cancelled.`, { parse_mode: "Markdown" })
    } catch (e) {
      console.error("Error in /delalert handler:", e)
      await ctx.reply("❌ Could not cancel that alert. Check the ID and try again.")
    }
  })

  bot.command("wallets", async (ctx) => {
    await ctx.reply(
      `💼 *Smart Money Wallet Tracking*\n\n` +
      `Radar tracks known alpha wallets (Wintermute, Jump Trading, DWF Labs, etc.) ` +
      `and alerts you when they hold a token you're researching.\n\n` +
      `*Submit a wallet for review:*\n` +
      `Open the Radar Mini App, research any token, and tap *Add Wallet* to submit a wallet address for our team to review.\n\n` +
      `Approved wallets are added to the tracking list within 24 hours.`,
      {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().webApp("💼 Open Radar", FRONTEND_URL),
      }
    )
  })

  bot.callbackQuery("trending", async (ctx) => {
    await ctx.answerCallbackQuery()
    const { getTrending } = await import("../services/dexscreener")
    const tokens = await getTrending()

    if (!tokens || tokens.length === 0) {
      await ctx.reply("❌ Could not load trending tokens right now.")
      return
    }

    const lines = tokens.slice(0, 10).map((t: { priceChange24h: number; symbol: string; price: number }, i: number) => {
      const change = t.priceChange24h >= 0 ? `+${t.priceChange24h.toFixed(1)}%` : `${t.priceChange24h.toFixed(1)}%`
      const emoji = t.priceChange24h >= 0 ? "🟢" : "🔴"
      return `${i + 1}. ${emoji} *$${t.symbol.toUpperCase()}* — $${t.price < 0.001 ? t.price.toExponential(2) : t.price.toFixed(4)} (${change})`
    })

    await ctx.reply(
      `📊 *Trending Tokens — Right Now*\n\n` + lines.join("\n") + `\n\n_Tap Open Radar for full research cards._`,
      {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().webApp("🔍 Open Radar", FRONTEND_URL),
      }
    )
  })

  bot.callbackQuery("help", async (ctx) => {
    await ctx.answerCallbackQuery()
    const helpText =
      `*📡 Radar — Commands*\n\n` +
      `/scan \`<address or $ticker>\` — Token research\n` +
      `/trending — Top tokens now\n` +
      `/ask \`<question>\` — AI crypto assistant\n` +
      `/alerts — Your price alerts\n` +
      `/delalert \`<id>\` — Cancel an alert\n` +
      `/wallets — Smart money tracking\n` +
      `/help — This message`

    await ctx.reply(helpText, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().webApp("🚀 Open Radar", FRONTEND_URL),
    })
  })

  bot.callbackQuery(/^alert:(.+):(.+):(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery("Open Radar to set a price alert for this token")
    const [, address, chain, symbol] = ctx.match
    await ctx.reply(
      `🔔 To set a price alert for *$${symbol?.toUpperCase() || "this token"}*, open Radar and tap *Set Alert* on the research card.`,
      {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().webApp(
          `🔔 Set Alert for $${symbol?.toUpperCase() || "Token"}`,
          `${FRONTEND_URL}?token=${address}&chain=${chain}`
        ),
      }
    )
  })

  bot.callbackQuery(/^askai:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    if (!ctx.chat) return
    const symbol = ctx.match[1]
    const msg = await ctx.reply(`🤖 Getting AI analysis for *$${symbol?.toUpperCase()}*...`, { parse_mode: "Markdown" })

    try {
      const { askGemini } = await import("../services/gemini")
      const answer = await askGemini(`Tell me about $${symbol} — is it a safe investment? Analyze the risks.`, [])
      const answerText = `🤖 *Radar AI — $${symbol?.toUpperCase()}*\n\n${answer}`
      const truncated = answerText.length > 4000 ? answerText.slice(0, 3997) + "..." : answerText

      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, truncated, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().webApp("💬 Continue in AI Chat", FRONTEND_URL),
      })
    } catch {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, "❌ AI is temporarily unavailable.")
    }
  })

  bot.hears("📊 Trending", async (ctx) => {
    await ctx.reply("⏳ Loading trending...")
    const { getTrending } = await import("../services/dexscreener")
    const tokens = await getTrending()

    if (!tokens || tokens.length === 0) {
      await ctx.reply("❌ Could not load trending tokens right now.")
      return
    }

    const lines = tokens.slice(0, 10).map((t: { priceChange24h: number; symbol: string; price: number }, i: number) => {
      const change = t.priceChange24h >= 0 ? `+${t.priceChange24h.toFixed(1)}%` : `${t.priceChange24h.toFixed(1)}%`
      return `${i + 1}. ${t.priceChange24h >= 0 ? "🟢" : "🔴"} *$${t.symbol.toUpperCase()}* (${change})`
    })

    await ctx.reply(`📊 *Trending Now*\n\n` + lines.join("\n"), {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().webApp("🔍 Full Research", FRONTEND_URL),
    })
  })

  bot.hears("🤖 AI Chat", async (ctx) => {
    await ctx.reply(
      "🤖 *Radar AI is ready.*\n\nAsk me anything:\n`/ask Is $BONK safe?`\n`/ask What is a rug pull?`\n\nOr open the full chat in the Mini App:",
      {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().webApp("💬 Open AI Chat", FRONTEND_URL),
      }
    )
  })

  bot.hears("🔔 My Alerts", async (ctx) => {
    const userId = ctx.from?.id
    if (!userId) return

    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5)

    if (!data || data.length === 0) {
      await ctx.reply(
        "🔔 You have no active alerts.\n\nSearch a token in Radar and tap *Set Alert* to create one.",
        {
          parse_mode: "Markdown",
          reply_markup: new InlineKeyboard().webApp("🔍 Open Radar", FRONTEND_URL),
        }
      )
      return
    }

    const lines = data.map((a: ActiveAlert, i: number) =>
      `${i + 1}. ${a.direction === "above" ? "⬆️" : "⬇️"} *$${(a.token_symbol || "???").toUpperCase()}* → $${a.target_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`
    )
    await ctx.reply(`🔔 *Your Alerts*\n\n` + lines.join("\n") + `\n\n_/delalert <id> to cancel_`, { parse_mode: "Markdown" })
  })

  bot.hears("ℹ️ Help", async (ctx) => {
    await ctx.reply(
      `*📡 Radar — Commands*\n\n` +
      `/scan \`<address or $ticker>\` — Token research card\n` +
      `/trending — Top tokens right now\n` +
      `/ask \`<question>\` — AI crypto assistant\n` +
      `/alerts — Your price alerts\n` +
      `/wallets — Smart money tracking\n\n` +
      `_Or use the *Open Radar* button for the full Mini App._`,
      {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().webApp("🚀 Open Radar", FRONTEND_URL),
      }
    )
  })

  bot.catch((err) => {
    console.error("Bot error:", err)
  })

  bot.start({
    onStart: (info) => console.log(`✅ Radar bot @${info.username} is running`),
  })
}

export async function startAlertPoller() {
  if (!bot) return

  console.log("⏰ Alert poller started (60s interval)")

  setInterval(async () => {
    try {
      const { data: alerts, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("is_active", true)
        .limit(50)

      if (error || !alerts || alerts.length === 0) return

      for (const alert of alerts as ActiveAlert[]) {
        try {
          const tokenData = await getTokenData(alert.token_address, alert.token_chain)
          if (!tokenData) continue

          const currentPrice = tokenData.price
          const hit =
            (alert.direction === "above" && currentPrice >= alert.target_price) ||
            (alert.direction === "below" && currentPrice <= alert.target_price)

          if (!hit) continue

          const dirEmoji = alert.direction === "above" ? "⬆️" : "⬇️"
          const symbol = alert.token_symbol || tokenData.symbol

          const alertMessage =
            `🔔 *Price Alert Triggered!*\n\n` +
            `${dirEmoji} *$${symbol.toUpperCase()}* has gone ${alert.direction} your target\n\n` +
            `🎯 *Target:* $${alert.target_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}\n` +
            `💵 *Current:* $${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}\n\n` +
            `_Open Radar for the full research card._`

          await bot.api.sendMessage(alert.user_id, alertMessage, {
            parse_mode: "Markdown",
            reply_markup: new InlineKeyboard().webApp(
              `🔬 Research $${symbol.toUpperCase()}`,
              `${FRONTEND_URL}?token=${alert.token_address}&chain=${alert.token_chain}`
            ),
          })

          await supabase
            .from("alerts")
            .update({ is_active: false })
            .eq("id", alert.id)

          console.log(`✅ Alert fired: ${alert.id} for user ${alert.user_id} ($${symbol})`)
        } catch (alertErr) {
          console.error(`Error processing alert ${alert.id}:`, alertErr)
        }
      }
    } catch (e) {
      console.error("Alert poller error:", e)
    }
  }, 60_000)
}
