import { useState, useEffect } from "react"
import { api } from "../lib/api"
import SearchBar from "../components/SearchBar"
import ResearchCard from "../components/ResearchCard"
import Icon from "../components/Icon"
import type { TokenData, ResearchCard as CardType } from "../types"
import { showBackButton, hideBackButton } from "../lib/telegram"

function isContractAddress(input: string): boolean {
  const clean = input.trim()
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  const evmRegex = /^0x[a-fA-F0-9]{40}$/
  return solanaRegex.test(clean) || evmRegex.test(clean)
}

interface Props {
  activeToken?: { address: string; chain: string } | null
  onClearActiveToken?: () => void
  onAskAI: (symbol: string) => void
}

export default function Research({ activeToken, onClearActiveToken, onAskAI }: Props) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TokenData[]>([])
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardLive, setIsCardLive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSelectToken = async (address: string, chain: string) => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const data = await api.getToken(address, chain)
      if (!data) {
        setError("Token details could not be retrieved")
        return
      }

      setSelectedCard(data)

      showBackButton()

      const cacheAge = Date.now() - data.tokenData.cachedAt
      if (cacheAge > 5000) {
        setIsCardLive(false)

        setTimeout(async () => {
          try {
            const freshData = await api.getToken(address, chain)
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
    } catch {
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
    hideBackButton()
  }

  const handleSearch = async (query: string) => {
    setLoading(true)
    setError(null)
    setResults([])
    setSelectedCard(null)

    try {
      if (isContractAddress(query)) {
        await handleSelectToken(query, "solana")
      } else {
        const data = await api.searchToken(query)
        if (data && data.length > 0) {
          setResults(data)
        } else {
          setError("No tokens found matching search query")
        }
      }
    } catch {
      setError("An error occurred during search")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSelectToken(activeToken.address, activeToken.chain)
    }
  }, [activeToken])

  useEffect(() => {
    const handleBack = () => {
      handleGoBack()
    }
    window.addEventListener("tma-back-button", handleBack)
    return () => {
      window.removeEventListener("tma-back-button", handleBack)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCard])

  return (
    <div className="w-full space-y-6">
      {/* Search Section */}
      <section className="flex flex-col gap-3">
        <SearchBar onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.12)] text-[#EF4444] border border-[#EF4444]/20 text-sm font-medium">
            <Icon name="warning" size={16} className="align-text-bottom mr-1" />
            {error}
          </div>
        )}

        {/* Results Disambiguation List */}
        {results.length > 0 && !selectedCard && (
          <div className="space-y-2.5">
            <h3 className="text-[12px] font-[600] text-[#958ea0] uppercase tracking-wider px-1">
              Search Results
            </h3>
            <div className="rounded-xl border border-[#494454]/30 overflow-hidden bg-[#1f1f26] divide-y divide-[#494454]/20">
              {results.map((token) => (
                <button
                  key={`${token.chain}-${token.address}`}
                  onClick={() => handleSelectToken(token.address, token.chain)}
                  className="w-full p-4 flex justify-between items-center text-left hover:bg-[#2a2931] transition-colors cursor-pointer border-none bg-transparent"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm text-[#e4e1eb]">
                        ${token.symbol.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#34343c] text-[#cbc3d7] uppercase">
                        {token.chain.slice(0, 3)}
                      </span>
                    </div>
                    <span className="text-xs text-[#cbc3d7] block mt-1">{token.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-medium text-sm block text-[#e4e1eb]">
                      ${token.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                    <span className="text-[10px] text-[#958ea0]">
                      Liq: ${token.liquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info/Education Card - when no card selected */}
        {!selectedCard && results.length === 0 && !loading && !error && (
          <div className="bg-[#1b1b22] p-4 rounded-xl border border-[#494454]/20 flex gap-4 items-center">
            <div className="bg-[rgba(208,188,255,0.12)] p-2 rounded-full">
              <Icon name="info" className="text-[#d0bcff]" />
            </div>
            <p className="text-[14px] font-[400] text-[#cbc3d7]">
              Radar scans 10,000+ Solana &amp; Ethereum contracts daily to keep you safe from potential rugs.
            </p>
          </div>
        )}
      </section>

      {/* Card Details View */}
      {selectedCard && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[12px] font-[600] text-[#958ea0] tracking-wider uppercase">Recent Search</h2>
            <div className="flex items-center gap-1.5 text-[#d0bcff] text-[10px] font-bold bg-[rgba(208,188,255,0.12)] px-2 py-0.5 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-[#d0bcff] pulse-dot"></div>
              <span>LIVE DATA</span>
            </div>
          </div>

          <ResearchCard
            card={selectedCard}
            isLive={isCardLive}
            onAskAI={onAskAI}
          />
        </section>
      )}
    </div>
  )
}
