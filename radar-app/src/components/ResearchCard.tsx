import { useState } from "react"
import type { ResearchCard as CardType } from "../types"
import RiskBadge from "./RiskBadge"
import AlertModal from "./AlertModal"

interface Props {
  card: CardType
  isLive: boolean
  onBack: () => void
}

export default function ResearchCard({ card, isLive, onBack }: Props) {
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const { tokenData, holderData, bundleDetected, smartMoneyMatches, riskScore, verdict } = card
  const isSolana = tokenData.chain.toLowerCase() === "solana"

  return (
    <div className="w-full bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] rounded-3xl p-5 shadow-sm border border-[var(--tg-theme-hint-color,#e5e7eb)] space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--tg-theme-text-color,#000000)]">
              🔍 ${tokenData.symbol.toUpperCase()}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize">
              {tokenData.chain}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{tokenData.name}</p>
        </div>
        <div className="text-right">
          {/* SWR Cache Status Tag */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
              isLive
                ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 animate-pulse"
            }`}
          >
            <span>{isLive ? "✅" : "⚡"}</span>
            {isLive ? "Live" : "Cached"}
          </span>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-2xl bg-[var(--tg-theme-bg-color,#ffffff)] border border-zinc-100 dark:border-zinc-800/60">
          <div className="text-xs text-zinc-400">💰 Price</div>
          <div className="font-semibold mt-0.5">${tokenData.price.toLocaleString(undefined, { maximumFractionDigits: 9 })}</div>
        </div>
        <div className="p-3 rounded-2xl bg-[var(--tg-theme-bg-color,#ffffff)] border border-zinc-100 dark:border-zinc-800/60">
          <div className="text-xs text-zinc-400">💧 Liquidity</div>
          <div className="font-semibold mt-0.5">${tokenData.liquidity.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-2xl bg-[var(--tg-theme-bg-color,#ffffff)] border border-zinc-100 dark:border-zinc-800/60">
          <div className="text-xs text-zinc-400">📊 Market Cap</div>
          <div className="font-semibold mt-0.5">${tokenData.marketCap.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-2xl bg-[var(--tg-theme-bg-color,#ffffff)] border border-zinc-100 dark:border-zinc-800/60">
          <div className="text-xs text-zinc-400">📈 24h Volume</div>
          <div className="font-semibold mt-0.5">${tokenData.volume24h.toLocaleString()}</div>
        </div>
      </div>

      {/* On-chain & Security checks */}
      <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        {holderData && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">👥 Top 10 holders</span>
            <span className="font-medium text-[var(--tg-theme-text-color,#000000)]">
              {holderData.topHolderPercent}% supply
            </span>
          </div>
        )}

        {/* Solana specific details - hidden for other chains */}
        {isSolana && (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">🧩 Bundle Status</span>
              <span className={`font-semibold ${bundleDetected ? "text-red-500" : "text-green-500"}`}>
                {bundleDetected ? "🚨 Bundle Detected" : "✅ No bundles detected"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">🧠 Smart Money</span>
              <span className="font-medium text-[var(--tg-theme-text-color,#000000)]">
                {smartMoneyMatches.length > 0
                  ? `${smartMoneyMatches.length} known wallets`
                  : "0 known wallets"}
              </span>
            </div>

            {smartMoneyMatches.length > 0 && (
              <div className="pl-3 border-l-2 border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 space-y-1 py-0.5">
                {smartMoneyMatches.map((m, idx) => (
                  <div key={idx}>• {m.label} ({m.address.slice(0, 4)}...{m.address.slice(-4)})</div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Verdict & Call to Action */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col items-center gap-3">
        <RiskBadge verdict={verdict} score={riskScore} />

        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-2xl text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:opacity-95 transition-opacity"
          >
            Go Back
          </button>
          <button
            onClick={() => setIsAlertOpen(true)}
            className="flex-1 py-3 rounded-2xl text-xs font-semibold bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] hover:opacity-90 transition-opacity shadow-sm"
          >
            🔔 Set Alert
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        tokenAddress={tokenData.address}
        tokenSymbol={tokenData.symbol}
        tokenChain={tokenData.chain}
        currentPrice={tokenData.price}
      />
    </div>
  )
}
