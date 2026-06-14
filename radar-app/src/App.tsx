import { useState, useEffect } from "react"
import BottomNav from "./components/BottomNav"
import Research from "./pages/Research"
import Trending from "./pages/Trending"
import AIChat from "./pages/AIChat"
import Icon from "./components/Icon"
import { initTelegram, onBackButtonClick } from "./lib/telegram"

type Tab = "research" | "trending" | "chat"

export default function App() {
  const [tab, setTab] = useState<Tab>("research")
  const [activeToken, setActiveToken] = useState<{ address: string; chain: string } | null>(null)

  useEffect(() => {
    initTelegram()

    const cleanup = onBackButtonClick(() => {
      window.dispatchEvent(new Event("tma-back-button"))
    })
    return cleanup
  }, [])

  const handleSelectToken = (address: string, chain: string) => {
    setActiveToken({ address, chain })
    setTab("research")
  }

  const handleAskAI = (symbol: string) => {
    sessionStorage.setItem("radar_pending_chat", `Tell me more about $${symbol.toUpperCase()}`)
    setTab("chat")
  }

  return (
    <div className="min-h-screen bg-[#051424] text-[#e4e1eb] font-sans antialiased overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-[#1f1f26]">
        <div className="flex items-center gap-2">
          <Icon name="radar" className="text-[#d0bcff]" />
          <h1 className="text-[20px] font-[600] font-display font-bold text-[#d0bcff]">Radar</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="active:scale-95 transition-transform hover:bg-[#34343c]/50 p-2 rounded-full border-none bg-transparent cursor-pointer">
            
          </button>
        </div>
      </header>

      {/* Content Canvas */}
      <main className="pt-20 pb-20 px-4 flex flex-col gap-6 max-w-md mx-auto">
        {tab === "research" && (
          <Research
            activeToken={activeToken}
            onClearActiveToken={() => setActiveToken(null)}
            onAskAI={handleAskAI}
          />
        )}
        {tab === "trending" && <Trending onSelectToken={handleSelectToken} />}
        {tab === "chat" && <AIChat />}
      </main>

      <BottomNav active={tab} onTab={setTab} />
    </div>
  )
}
