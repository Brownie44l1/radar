interface Props {
  active: "research" | "trending" | "chat"
  onTab: (tab: "research" | "trending" | "chat") => void
}

export default function BottomNav({ active, onTab }: Props) {
  const tabs = [
    { id: "research" as const, label: "Research", icon: "🔍" },
    { id: "trending" as const, label: "Trending", icon: "🔥" },
    { id: "chat" as const, label: "AI Chat", icon: "🤖" },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t border-[var(--tg-theme-hint-color,#e5e7eb)] bg-[var(--tg-theme-bg-color,#ffffff)] z-50 shadow-lg">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          className={`flex-1 py-2 border-none bg-transparent cursor-pointer flex flex-col items-center gap-1 transition-all duration-200 ${
            active === t.id
              ? "opacity-100 font-semibold text-[var(--tg-theme-button-color,#3b82f6)] scale-105"
              : "opacity-60 text-[var(--tg-theme-text-color,#000000)] hover:opacity-85"
          }`}
        >
          <span className="text-xl">{t.icon}</span>
          <span className="text-xs">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
