import { useState, useEffect } from "react"
import BottomNav from "./components/BottomNav"
import Research from "./pages/Research"
import Trending from "./pages/Trending"
import AIChat from "./pages/AIChat"

type Tab = "research" | "trending" | "chat"

export default function App() {
  const [tab, setTab] = useState<Tab>("research")

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
    }
  }, [])

  return (
    <div className="pb-16 min-h-screen bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#000000)]">
      {tab === "research" && <Research />}
      {tab === "trending" && <Trending />}
      {tab === "chat" && <AIChat />}
      <BottomNav active={tab} onTab={setTab} />
    </div>
  )
}
