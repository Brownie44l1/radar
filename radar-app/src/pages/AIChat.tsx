import { useState, useRef, useEffect } from "react"
import { api } from "../lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  "Is $BONK a safe buy?",
  "What is liquidity pool in crypto?",
  "How to detect token bundle?",
  "Tips to avoid crypto rugs",
]

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem("radar_chat_history")
    return saved ? JSON.parse(saved) : []
  })
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sessionStorage.setItem("radar_chat_history", JSON.stringify(messages))
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const response = await api.chat(text, chatHistory)
      if (response) {
        setMessages((prev) => [...prev, { role: "assistant", content: response }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I encountered an issue. Please try again." },
        ])
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to AI assistant." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    sessionStorage.removeItem("radar_chat_history")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-h-[800px] w-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            AI Assistant
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Instant crypto intelligence powered by Gemini</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages / Welcome View */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full filter blur-xl opacity-30 animate-pulse"></div>
              <div className="relative text-5xl p-4 bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                🤖
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-lg font-bold text-[var(--tg-theme-text-color,#000000)]">
                Ask Radar AI anything
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Scan tokens, understand smart money metrics, or get clear explanations of DeFi concepts instantly.
              </p>
            </div>

            {/* Suggestion Chips */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm pt-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="p-3 text-left rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-800 transition-all duration-200 active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] font-medium rounded-tr-none"
                      : "bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] text-[var(--tg-theme-text-color,#000000)] border border-zinc-200/40 dark:border-zinc-800/60 rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {loading && (
              <div className="flex w-full justify-start">
                <div className="bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] text-[var(--tg-theme-text-color,#000000)] border border-zinc-200/40 dark:border-zinc-800/60 rounded-3xl rounded-tl-none p-4 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(input)
        }}
        className="pt-2"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask AI about crypto tokens..."
            className="w-full py-3.5 pl-4 pr-12 rounded-2xl border border-[var(--tg-theme-hint-color,#e5e7eb)] bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] text-[var(--tg-theme-text-color,#000000)] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color,#3b82f6)] focus:border-transparent transition-all duration-300 shadow-sm text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 p-2 rounded-xl bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg
              className="h-5.5 w-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
