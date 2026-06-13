import { useState, useEffect } from "react"
import BottomNav from "./components/BottomNav"
import Research from "./pages/Research"
import Trending from "./pages/Trending"
import AIChat from "./pages/AIChat"

type Tab = "research" | "trending" | "chat"

export default function App() {
  const [tab, setTab] = useState<Tab>("research")
  const [activeToken, setActiveToken] = useState<{ address: string; chain: string } | null>(null)

  useEffect(() => {
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          ready: () => void
          expand: () => void
          BackButton?: {
            onClick: (cb: () => void) => void
            offClick: (cb: () => void) => void
          }
        }
      }
    }).Telegram?.WebApp

    if (tg) {
      tg.ready()
      tg.expand()

      // Set up back button handler that dispatches a global window event
      if (tg.BackButton) {
        const handleBackClick = () => {
          window.dispatchEvent(new Event("tma-back-button"))
        }
        tg.BackButton.onClick(handleBackClick)
        return () => {
          tg.BackButton.offClick(handleBackClick)
        }
      }
    }
  }, [])

  const handleSelectToken = (address: string, chain: string) => {
    setActiveToken({ address, chain })
    setTab("research")
  }

  return (
    <div className="pb-16 min-h-screen bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#000000)] font-sans antialiased selection:bg-[var(--tg-theme-button-color,#3b82f6)] selection:text-[var(--tg-theme-button-text-color,#ffffff)]">
      <main className="max-w-md mx-auto min-h-screen px-4 pt-4">
        {tab === "research" && (
          <Research activeToken={activeToken} onClearActiveToken={() => setActiveToken(null)} />
        )}
        {tab === "trending" && <Trending onSelectToken={handleSelectToken} />}
        {tab === "chat" && <AIChat />}
      </main>
      <BottomNav active={tab} onTab={setTab} />
    </div>
  )
}
