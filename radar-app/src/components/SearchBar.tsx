import { useState } from "react"

interface Props {
  onSearch: (query: string) => void
  loading: boolean
}

const POPULAR_TOKENS = ["SOL", "ETH", "USDT"]

export default function SearchBar({ onSearch, loading }: Props) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !loading) {
      onSearch(input.trim())
    }
  }

  return (
    <div className="flex flex-col gap-stack-sm">
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search token, ticker or address"
          className="w-full glass-input h-14 pl-12 pr-4 rounded-xl text-[14px] text-[#e4e1eb] focus:outline-none focus:ring-2 focus:ring-[#d0bcff]/50 transition-all placeholder:text-[#cbc3d7]/60"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <svg className="w-5 h-5 text-[#d0bcff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-[#d0bcff]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </form>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
        <span className="text-[11px] font-[600] text-[#958ea0] px-2">Popular:</span>
        {POPULAR_TOKENS.map((token) => (
          <button
            key={token}
            type="button"
            onClick={() => onSearch(token)}
            className="bg-[#2a2931] px-3 py-1.5 rounded-full text-[12px] font-[600] text-[#d0bcff] whitespace-nowrap active:opacity-70 transition-opacity border-none cursor-pointer"
          >
            {token}
          </button>
        ))}
      </div>
    </div>
  )
}
