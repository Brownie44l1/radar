import { useState, useEffect } from "react"
import { api } from "../lib/api"
import type { TrendingToken } from "../types"

interface Props {
  onSelectToken: (address: string, chain: string) => void
}

export default function Trending({ onSelectToken }: Props) {
  const [tokens, setTokens] = useState<TrendingToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrending = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getTrending()
      if (data) {
        setTokens(data)
      } else {
        setError("Failed to fetch trending tokens.")
      }
    } catch (e) {
      setError("An error occurred while loading trending tokens.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrending()
  }, [])

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
            Trending Feed
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time trending tokens across Solana & Base
          </p>
        </div>
        <button
          onClick={fetchTrending}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] border border-[var(--tg-theme-hint-color,#e5e7eb)] hover:opacity-80 transition-all active:scale-95 disabled:opacity-50"
          title="Refresh Feed"
        >
          <svg
            className={`w-4 h-4 text-[var(--tg-theme-text-color,#000000)] ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M21 3v5h-5"
            />
          </svg>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex flex-col">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex items-center px-0 py-4 border-b border-[#494454]/10 animate-pulse">
              <div className="w-8 h-4 bg-[#34343c] rounded ml-2" />
              <div className="flex-1 ml-2 space-y-1.5">
                <div className="h-4 w-20 bg-[#34343c] rounded" />
                <div className="h-3 w-28 bg-[#34343c] rounded" />
              </div>
              <div className="space-y-2 flex flex-col items-end">
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Token List */
        <div className="space-y-2.5">
          {tokens.map((token, index) => {
            const isPositive = token.priceChange24h >= 0
            return (
              <button
                key={`${token.chain}-${token.address}-${index}`}
                onClick={() => onSelectToken(token.address, token.chain)}
                className="w-full p-4 flex justify-between items-center text-left bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-[var(--tg-theme-hint-color,#e5e7eb)] rounded-3xl transition-all duration-300 active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[var(--tg-theme-text-color,#000000)] group-hover:text-[var(--tg-theme-link-color,#3b82f6)] transition-colors">
                        ${token.symbol.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 capitalize">
                        {token.chain}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 block mt-0.5 max-w-[150px] truncate">
                      {token.name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-semibold text-sm block text-[var(--tg-theme-text-color,#000000)]">
                    ${token.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span
                      className={`text-xs font-bold ${
                        isPositive ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {token.priceChange24h.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-zinc-400">• Vol: ${token.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
