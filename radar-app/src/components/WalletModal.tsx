import { useState } from "react"
import { api } from "../lib/api"
import Icon from "./Icon"
import { hapticSuccess } from "../lib/telegram"

interface Props {
  isOpen: boolean
  onClose: () => void
  tokenSymbol?: string
}

export default function WalletModal({ isOpen, onClose, tokenSymbol }: Props) {
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const isValidSolanaAddress = (addr: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletAddress.trim()) return

    if (!isValidSolanaAddress(walletAddress.trim())) {
      setMessage("Invalid Solana address format")
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await api.submitWallet(walletAddress.trim())
      if (res) {
        hapticSuccess()
        setMessage("Submitted - we'll review and add if it qualifies")
        setTimeout(() => {
          onClose()
          setWalletAddress("")
          setMessage(null)
        }, 1500)
      } else {
        setMessage("Failed to submit wallet. Please try again.")
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
            <h2 className="text-[17px] font-[700] text-[#e4e1eb]">Submit Wallet</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[#34343c]/50 text-[#cbc3d7] border-none bg-transparent cursor-pointer"
            >
              <Icon name="close" />
            </button>
          </div>

          <p className="text-[14px] font-[400] text-[#cbc3d7]">
            Submit a wallet address you believe is smart money{tokenSymbol ? ` for ${tokenSymbol}` : ""}. We'll review and add it to our tracking.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-[600] text-[#958ea0] mb-1 block">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address..."
                className="w-full glass-input h-12 px-4 rounded-lg text-base text-[#e4e1eb] font-semibold focus:outline-none focus:ring-2 focus:ring-[#d0bcff]/50 transition-all placeholder:text-[#cbc3d7]/60"
                required
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-[12px] font-medium ${
                message.includes("Success") || message.includes("Submitted")
                  ? "bg-[rgba(16,185,129,0.12)] text-[#10B981]"
                  : "bg-[rgba(239,68,68,0.12)] text-[#EF4444]"
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !walletAddress.trim()}
              className="w-full h-12 rounded-xl bg-[#d0bcff] text-[#3c0091] text-[16px] font-[600] flex items-center justify-center active:scale-95 transition-transform shadow-sm border-none cursor-pointer disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Wallet"}
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
