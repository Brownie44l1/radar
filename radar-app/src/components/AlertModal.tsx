import { useState } from "react"
import { api } from "../lib/api"
import Icon from "./Icon"
import { hapticSuccess } from "../lib/telegram"

interface Props {
  isOpen: boolean
  onClose: () => void
  tokenAddress: string
  tokenSymbol: string
  tokenChain: string
  currentPrice: number
}

export default function AlertModal({ isOpen, onClose, tokenAddress, tokenSymbol, tokenChain, currentPrice }: Props) {
  const [targetPrice, setTargetPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const parsedTarget = parseFloat(targetPrice)
  const alertDirection = parsedTarget > currentPrice ? "above" : parsedTarget < currentPrice ? "below" : null

  const handleSetAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(targetPrice)
    if (isNaN(target) || target <= 0) {
      setMessage("Please enter a valid target price")
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await api.setAlert(tokenAddress, target, tokenSymbol, tokenChain)
      if (res) {
        hapticSuccess()
        setMessage(`Success! Alert set for $${target}`)
        setTimeout(() => {
          onClose()
          setTargetPrice("")
          setMessage(null)
        }, 1500)
      } else {
        setMessage("Failed to set alert. Please try again.")
      }
    } catch {
      setMessage("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#051424]/80 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-[#1f1f26] rounded-xl border border-[#494454]/30 shadow-lg overflow-hidden">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-[17px] font-[700] text-[#e4e1eb]">Set Price Alert</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[#34343c]/50 text-[#cbc3d7] border-none bg-transparent cursor-pointer"
            >
              <Icon name="close" />
            </button>
          </div>

          <p className="text-[14px] font-[400] text-[#cbc3d7]">
            Get a Telegram DM when ${tokenSymbol.toUpperCase()} hits your target price.
          </p>

          <div className="py-2 px-4 rounded-lg glass-input text-sm">
            <div className="text-[11px] font-[500] text-[#958ea0]">Current Price</div>
            <div className="font-semibold text-base text-[#e4e1eb]">
              ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 9 })}
            </div>
          </div>

          {alertDirection && (
            <div className="text-[12px] font-[500] text-[#d0bcff]">
              Alert when price goes <span className="font-bold uppercase">{alertDirection}</span> ${
                parsedTarget.toLocaleString(undefined, { maximumFractionDigits: 9 })
              }
            </div>
          )}

          <form onSubmit={handleSetAlert} className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-[600] text-[#958ea0] mb-1 block">Target Price (USD)</label>
              <div className="flex items-center glass-input h-12 rounded-lg focus-within:ring-2 focus-within:ring-[#d0bcff]/50 transition-all">
                <span className="pl-5 text-[#cbc3d7] text-base font-semibold">$</span>
                <input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g. 0.000025"
                  className="w-full h-full bg-transparent pr-4 rounded-lg text-base text-[#e4e1eb] font-semibold focus:outline-none placeholder:text-[#cbc3d7]/60"
                  required
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-[12px] font-medium ${
                message.includes("Success")
                  ? "bg-[rgba(16,185,129,0.12)] text-[#10B981]"
                  : "bg-[rgba(239,68,68,0.12)] text-[#EF4444]"
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#d0bcff] text-[#3c0091] text-[16px] font-[600] flex items-center justify-center active:scale-95 transition-transform shadow-sm border-none cursor-pointer disabled:opacity-50"
            >
              {loading ? "Setting Alert..." : "Set Alert"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-transparent text-[#e4e1eb] text-[16px] font-[600] flex items-center justify-center border border-[#494454]/50 active:scale-95 transition-transform cursor-pointer"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
