import { useState, useEffect } from "react"
import { api } from "../lib/api"
import Icon from "../components/Icon"
import type { TrendingToken } from "../types"

const INITIAL_DISPLAY = 20
const LOAD_MORE_INCREMENT = 10

interface Props {
  onSelectToken: (address: string, chain: string) => void
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`
  return `$${vol.toFixed(0)}`
}

function formatPrice(price: number): string {
  if (price < 0.00001) return price.toExponential(2)
  if (price < 1) return price.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function Trending({ onSelectToken }: Props) {
  const [allTokens, setAllTokens] = useState<TrendingToken[]>([])
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const visibleTokens = allTokens.slice(0, displayCount)
  const hasMore = displayCount < allTokens.length

  useEffect(() => {
    (async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.getTrending()
        if (data) {
          setAllTokens(data)
        } else {
          setError("Failed to fetch trending tokens.")
        }
      } catch {
        setError("An error occurred while loading trending tokens.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + LOAD_MORE_INCREMENT)
  }

  return (
    <div className="w-full">
      {/* Live Indicator & Title */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-[22px] font-[700] font-display tracking-tight text-[#e4e1eb]">
            Trending now
          </h1>
          <p className="text-[12px] font-[400] text-[#cbc3d7] flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#d0bcff] animate-pulse" />
            Live feed from DEXScreener
          </p>
        </div>
        <div className="bg-[#2a2931] px-3 py-1.5 rounded-full border border-[#494454]/30 flex items-center gap-2">
          <span className="text-[12px] font-[600] text-[#e4e1eb]">All Chains</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#cbc3d7]">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.12)] text-[#EF4444] border border-[#EF4444]/20 text-sm font-medium mb-4">
          <Icon name="warning" size={16} className="align-text-bottom mr-1" />
          {error}
        </div>
      )}

      {/* Token Table Header */}
      <div className="border-b border-[#494454]/20 py-2 flex items-center text-[#cbc3d7] text-[12px] font-[600] uppercase tracking-wider">
        <div className="w-8 text-center">#</div>
        <div className="flex-1 ml-2">Token / Chain</div>
        <div className="w-24 text-right">Price</div>
        <div className="w-20 text-right">24h</div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-0">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex items-center px-0 py-4 border-b border-[#494454]/10 animate-pulse">
              <div className="w-8 text-center" />
              <div className="flex-1 ml-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#34343c]" />
                <div className="space-y-1.5">
                  <div className="h-4 w-16 bg-[#34343c] rounded" />
                  <div className="h-3 w-20 bg-[#34343c] rounded" />
                </div>
              </div>
              <div className="w-24 text-right space-y-1">
                <div className="h-4 w-16 bg-[#34343c] rounded ml-auto" />
                <div className="h-3 w-12 bg-[#34343c] rounded ml-auto" />
              </div>
              <div className="w-20 text-right">
                <div className="h-4 w-12 bg-[#34343c] rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Token List */}
          <div className="flex flex-col">
            {visibleTokens.map((token, index) => {
              const isPositive = token.priceChange24h >= 0
              return (
                <button
                  key={`${token.chain}-${token.address}-${index}`}
                  onClick={() => onSelectToken(token.address, token.chain)}
                  className="flex items-center px-0 py-4 transition-colors border-b border-[#494454]/10 active:bg-[rgba(39,54,71,0.5)] text-left w-full border-none bg-transparent cursor-pointer"
                >
                  <div className="w-8 text-center text-[15px] font-[400] text-[#cbc3d7] font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 ml-2 flex items-center gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] font-[500] text-[#e4e1eb]">
                        ${token.symbol.toUpperCase()}
                      </div>
                      <div className="text-[11px] font-[500] text-[#cbc3d7] truncate">
                        {token.name}
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-[14px] font-[400] text-[#e4e1eb] font-mono">
                      ${formatPrice(token.price)}
                    </div>
                    <div className="text-[11px] text-[#cbc3d7] uppercase font-bold tracking-tighter">
                      {formatVolume(token.volume24h)} Vol
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <div className={`text-[13px] font-bold font-mono ${isPositive ? "text-[#d0bcff]" : "text-[#EF4444]"}`}>
                      {isPositive ? "+" : ""}{token.priceChange24h.toFixed(1)}%
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="py-4 flex justify-center">
              <button
                onClick={handleLoadMore}
                className="bg-[#2a2931] hover:bg-[#34343c]/50 text-[#e4e1eb] text-[12px] font-[600] px-6 py-2.5 rounded-full transition-all active:scale-95 border border-[#494454]/30 cursor-pointer"
              >
                Load more trending
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
