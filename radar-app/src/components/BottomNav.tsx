import Icon from "./Icon"

interface Props {
  active: "research" | "trending" | "chat"
  onTab: (tab: "research" | "trending" | "chat") => void
}

export default function BottomNav({ active, onTab }: Props) {
  const tabs = [
    { id: "research" as const, label: "Research", icon: "search" },
    { id: "trending" as const, label: "Trending", icon: "trending_up" },
    { id: "chat" as const, label: "AI Chat", icon: "chatbot" },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 bg-[#1f1f26] shadow-sm rounded-t-xl">
      {tabs.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={`flex flex-col items-center justify-center px-4 py-1 active:opacity-80 transition-opacity border-none bg-transparent cursor-pointer ${
              isActive ? "text-[#e4e1eb]" : "text-[#cbc3d7] hover:text-[#d0bcff]"
            }`}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              isActive ? "bg-[#454650]" : ""
            }`}>
              <Icon name={t.icon} size={22} />
            </div>
            <span className="text-[11px] font-[500] leading-none">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
