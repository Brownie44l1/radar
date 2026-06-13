import { useState } from "react"
import { api } from "../lib/api"

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
        // Trigger haptic feedback if available on Telegram
        const tg = (window as any).Telegram?.WebApp
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.notificationOccurred("success")
        }
        setMessage(`Success! Alert set for $${target}`)
        setTimeout(() => {
          onClose()
          setTargetPrice("")
          setMessage(null)
        }, 1500)
      } else {
        setMessage("Failed to set alert. Please try again.")
      }
    } catch (err) {
      setMessage("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--tg-theme-hint-color,#e5e7eb)] bg-[var(--tg-theme-bg-color,#ffffff)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--tg-theme-text-color,#000000)]">Set Price Alert</h3>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 py-2 px-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] text-sm">
          <div className="text-xs text-zinc-400">Current Price</div>
          <div className="font-semibold text-base">${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 9 })}</div>
        </div>

        <form onSubmit={handleSetAlert} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Target Price (USD)</label>
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g. 0.000025 or 1.50"
              className="w-full py-2.5 px-4 rounded-2xl border border-[var(--tg-theme-hint-color,#e5e7eb)] bg-transparent text-[var(--tg-theme-text-color,#000000)] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color,#3b82f6)] text-sm"
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded-2xl text-xs font-medium ${message.includes("Success") ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-semibold bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] hover:opacity-90 disabled:opacity-50 transition-all duration-200 text-sm shadow-sm"
          >
            {loading ? "Setting Alert..." : "Confirm Alert"}
          </button>
        </form>
      </div>
    </div>
  )
}
