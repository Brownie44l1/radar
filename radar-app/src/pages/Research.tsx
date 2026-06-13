import { useState, useEffect } from "react"
import { api } from "../lib/api"
import SearchBar from "../components/SearchBar"
import ResearchCard from "../components/ResearchCard"
import type { TokenData, ResearchCard as CardType } from "../types"

function isContractAddress(input: string): boolean {
  const clean = input.trim()
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  const evmRegex = /^0x[a-fA-F0-9]{40}$/
  return solanaRegex.test(clean) || evmRegex.test(clean)
}

interface Props {
  activeToken?: { address: string; chain: string } | null
  onClearActiveToken?: () => void
}

export default function Research({ activeToken, onClearActiveToken }: Props) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TokenData[]>([])
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardLive, setIsCardLive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Trigger loading of active token if passed as a prop
  useEffect(() => {
    if (activeToken) {
      handleSelectToken(activeToken.address, activeToken.chain)
    }
  }, [activeToken])

  // Register back button listener
  useEffect(() => {
    const handleBack = () => {
      handleGoBack()
    }
    window.addEventListener("tma-back-button", handleBack)
    return () => {
      window.removeEventListener("tma-back-button", handleBack)
    }
  }, [selectedCard])

  const handleSearch = async (query: string) => {
    setLoading(true)
    setError(null)
    setResults([])
    setSelectedCard(null)

    try {
      if (isContractAddress(query)) {
        // Direct contract lookup
        await handleSelectToken(query, "solana")
      } else {
        // Ticker/Name search
        const data = await api.searchToken(query)
        if (data && data.length > 0) {
          setResults(data)
        } else {
          setError("No tokens found matching search query")
        }
      }
    } catch (err) {
      setError("An error occurred during search")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectToken = async (address: string, chain: string) => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      // 1. Fetch initial card (could be cached)
      const data = (await api.getToken(address, chain)) as CardType | null
      if (!data) {
        setError("Token details could not be retrieved")
        return
      }

      setSelectedCard(data)

      // Show back button on Telegram WebApp
      const tg = (window as unknown as {
        Telegram?: {
          WebApp?: {
            BackButton?: {
              show: () => void
              hide: () => void
            }
          }
        }
      }).Telegram?.WebApp
      if (tg?.BackButton) {
        tg.BackButton.show()
      }

      // 2. Stale-While-Revalidate check
      const cacheAge = Date.now() - data.tokenData.cachedAt
      if (cacheAge > 5000) {
        // If data is older than 5s, mark as cached and fetch fresh data in background
        setIsCardLive(false)
        
        setTimeout(async () => {
          try {
            const freshData = (await api.getToken(address, chain)) as CardType | null
            if (freshData) {
              setSelectedCard(freshData)
              setIsCardLive(true)
            }
          } catch (e) {
            console.warn("SWR background refresh failed:", e)
          }
        }, 1500)
      } else {
        setIsCardLive(true)
      }
    } catch (err) {
      setError("Failed to load token research card")
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    setSelectedCard(null)
    setResults([])
    setError(null)
    if (onClearActiveToken) {
      onClearActiveToken()
    }
    // Hide Telegram WebApp BackButton
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          BackButton?: {
            show: () => void
            hide: () => void
          }
        }
      }
    }).Telegram?.WebApp
    if (tg?.BackButton) {
      tg.BackButton.hide()
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Search View */}
      {!selectedCard && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Radar Research
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Analyze tokens and scan rugs instantly inside SwiftyEx
            </p>
          </div>

          <SearchBar onSearch={handleSearch} loading={loading} />

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Results Disambiguation List */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 px-1">Search Results</h3>
              <div className="rounded-3xl border border-[var(--tg-theme-hint-color,#e5e7eb)] overflow-hidden bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] divide-y divide-zinc-200 dark:divide-zinc-800">
                {results.map((token) => (
                  <button
                    key={`${token.chain}-${token.address}`}
                    onClick={() => handleSelectToken(token.address, token.chain)}
                    className="w-full p-4 flex justify-between items-center text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[var(--tg-theme-text-color,#000000)]">
                          ${token.symbol.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 capitalize">
                          {token.chain}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 block mt-0.5">{token.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm block text-[var(--tg-theme-text-color,#000000)]">
                        ${token.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Liq: ${token.liquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State / Shortcuts */}
          {results.length === 0 && !loading && (
            <div className="p-6 rounded-3xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
              <div className="text-3xl mb-2">💡</div>
              <h4 className="text-sm font-semibold text-[var(--tg-theme-text-color,#000000)]">How to use</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1 leading-relaxed">
                Paste any Solana contract address directly to skip search, or query by token symbol (e.g. BONK).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Card Details View */}
      {selectedCard && (
        <ResearchCard card={selectedCard} isLive={isCardLive} onBack={handleGoBack} />
      )}
    </div>
  )
}
