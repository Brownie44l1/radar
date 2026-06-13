import { useState } from "react"
import type { ResearchCard as CardType } from "../types"
import AlertModal from "./AlertModal"
import WalletModal from "./WalletModal"
import Icon from "./Icon"

interface Props {
  card: CardType
  isLive: boolean
  onAskAI: (symbol: string) => void
}

function formatTokenAge(hours?: number): string {
  if (hours === undefined || hours === null) return "N/A"
  if (hours < 1) return "< 1 hour"
  if (hours < 24) return `${Math.round(hours)} hours`
  const days = Math.round(hours / 24)
  return `${days} Days`
}

export default function ResearchCard({ card, isLive, onAskAI }: Props) {
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)

  const { tokenData, holderData, bundleDetected, smartMoneyMatches, riskScore, verdict, tokenAgeHours } = card
  const isSolana = tokenData.chain.toLowerCase() === "solana"

  const isDanger = riskScore > 60
  const isWarning = riskScore > 30 && riskScore <= 60

  let verdictExplanation = ""
  if (isDanger) {
    verdictExplanation = `Critical rug signals detected. ${
      bundleDetected ? "Launch bundle detected. " : ""
    }${
      holderData && holderData.topHolderPercent > 40
        ? `Top 10 holders control ${holderData.topHolderPercent}% of supply.`
        : ""
    } Liquidity is extremely low.`
  } else if (isWarning) {
    verdictExplanation = `Proceed carefully. ${
      holderData ? `Top 10 holders control ${holderData.topHolderPercent}% of supply. ` : ""
    }Liquidity is moderate for this market size.`
  } else {
    verdictExplanation = "No major security flags. Token shows stable holder distribution, clean launch patterns, and healthy liquidity pools."
  }

  return (
    <div className="bg-[#1f1f26] rounded-xl overflow-hidden shadow-sm border border-[#494454]/30">
      {/* Card Header */}
      <div className="p-4 flex items-start justify-between bg-[#2a2931]/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#34343c] flex items-center justify-center border border-[#d0bcff]/20 font-display font-bold text-base text-[#d0bcff] flex-shrink-0">
            {tokenData.symbol.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-[500] text-[#e4e1eb]">${tokenData.symbol.toUpperCase()}</h3>
              <span className="bg-[#34343c] text-[#cbc3d7] text-[10px] px-1.5 py-0.5 rounded font-mono font-[400]">
                {tokenData.chain.slice(0, 3)}
              </span>
            </div>
            <p className="text-[14px] font-[400] text-[#cbc3d7]">{tokenData.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[17px] font-[500] text-[#d0bcff]">
            ${tokenData.price.toLocaleString(undefined, { maximumFractionDigits: 9 })}
          </p>
          <p className={`text-[12px] font-[600] inline-block px-1 rounded ${
            tokenData.priceChange24h >= 0
              ? "text-[#10B981] bg-[rgba(16,185,129,0.2)]"
              : "text-[#EF4444] bg-[rgba(239,68,68,0.2)]"
          }`}>
            {tokenData.priceChange24h >= 0 ? "+" : ""}{tokenData.priceChange24h.toFixed(1)}% (24h)
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 border-t border-[#494454]/20">
        <div className="bg-[#1b1b22] p-3 rounded-lg flex flex-col gap-1">
          <span className="text-[12px] font-[600] text-[#cbc3d7]">Liquidity</span>
          <span className="text-[16px] font-bold text-[#e4e1eb]">
            ${tokenData.liquidity.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}
          </span>
        </div>
        <div className="bg-[#1b1b22] p-3 rounded-lg flex flex-col gap-1">
          <span className="text-[12px] font-[600] text-[#cbc3d7]">Market Cap</span>
          <span className="text-[16px] font-bold text-[#e4e1eb]">
            ${tokenData.marketCap.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}
          </span>
        </div>
        <div className="bg-[#1b1b22] p-3 rounded-lg flex flex-col gap-1">
          <span className="text-[12px] font-[600] text-[#cbc3d7]">24h Volume</span>
          <span className="text-[16px] font-bold text-[#e4e1eb]">
            ${tokenData.volume24h.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}
          </span>
        </div>
        <div className="bg-[#1b1b22] p-3 rounded-lg flex flex-col gap-1">
          <span className="text-[12px] font-[600] text-[#cbc3d7]">Token Age</span>
          <span className="text-[16px] font-bold text-[#e4e1eb]">
            {formatTokenAge(tokenAgeHours)}
          </span>
        </div>
      </div>

      {/* Security/Risk Section */}
      <div className="mx-4 p-4 bg-[#2a2931] rounded-lg flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between border-b border-[#494454]/20 pb-2">
          <div className="flex items-center gap-2">
            <Icon name="groups" size={12} className="text-[#cbc3d7]" />
            <span className="text-[12px] font-[600] text-[#cbc3d7]">Top 10 Holders</span>
          </div>
          <span className="text-[14px] font-bold text-[#e4e1eb]">
            {holderData ? `${holderData.topHolderPercent}%` : "0%"} Supply
          </span>
        </div>
        <div className={`p-3 rounded-lg border ${
          isDanger
            ? "bg-[rgba(206,189,255,0.1)] border-[rgba(206,189,255,0.3)]"
            : isWarning
              ? "bg-[rgba(206,189,255,0.1)] border-[rgba(206,189,255,0.3)]"
              : "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)]"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Icon
              name={isDanger || isWarning ? "warning" : "check_circle"}
              size={18}
              className={isDanger ? "text-[#EF4444]" : isWarning ? "text-[#F59E0B]" : "text-[#10B981]"}
            />
            <span className={`text-[12px] font-bold uppercase tracking-tight ${
              isDanger ? "text-[#EF4444]" : isWarning ? "text-[#F59E0B]" : "text-[#10B981]"
            }`}>
              Verdict: {verdict}
            </span>
          </div>
          <p className="text-[14px] font-[400] text-[#e4e1eb]">{verdictExplanation}</p>
        </div>
      </div>

      {/* Smart Money (Solana only) */}
      {isSolana && smartMoneyMatches.length > 0 && (
        <div className="mx-4 mb-4 flex items-center gap-2.5 p-3 bg-[rgba(208,188,255,0.12)] border border-[rgba(208,188,255,0.2)] rounded-lg">
          <Icon name="radar_2" size={18} className="text-[#d0bcff]" />
          <div className="text-[12.5px] leading-relaxed text-[#e4e1eb]">
            <b>{smartMoneyMatches.length} tracked wallets</b> hold this token
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex flex-col gap-3 border-t border-[#494454]/20">
        <div className="flex gap-3">
          <button
            onClick={() => setIsAlertOpen(true)}
            className="flex-1 h-12 rounded-xl bg-[#d0bcff] text-[#3c0091] text-[16px] font-[600] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm border-none cursor-pointer"
          >
            <Icon name="notifications" size={20} /> 
            Set Alert
          </button>
          <button
            onClick={() => setIsWalletOpen(true)}
            className="flex-1 h-12 rounded-xl bg-[#34343c] text-[#e4e1eb] text-[16px] font-[600] flex items-center justify-center gap-2 active:scale-95 transition-transform border border-[#494454]/50 cursor-pointer"
          >
            <Icon name="account_balance_wallet" size={20} />
            Add Wallet
          </button>
        </div>

        {/* Ask AI button */}
        <button
          onClick={() => onAskAI(tokenData.symbol)}
          className="w-full h-10 rounded-lg bg-[rgba(208,188,255,0.12)] text-[#d0bcff] text-[13px] font-[600] flex items-center justify-center gap-2 active:scale-95 transition-transform border border-[rgba(208,188,255,0.2)] cursor-pointer"
        >
          <Icon name="message_circle" size={16} />
          Ask AI about ${tokenData.symbol.toUpperCase()}
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-[#34343c]/20 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#cbc3d7] text-[10px]">
          <Icon name="check_circle" size={12} className="text-[#d0bcff]" />
          <span>{isLive ? "Live · updated just now" : "Cached · refreshing..."}</span>
        </div>
        <div className="text-[10px] text-[#958ea0]">v2.41 Research Engine</div>
      </div>

      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        tokenAddress={tokenData.address}
        tokenSymbol={tokenData.symbol}
        tokenChain={tokenData.chain}
        currentPrice={tokenData.price}
      />
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        tokenSymbol={tokenData.symbol}
      />
    </div>
  )
}
