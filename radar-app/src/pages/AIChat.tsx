import { useState, useRef, useEffect } from "react"
import { api } from "../lib/api"
import Icon from "../components/Icon"

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
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sessionStorage.setItem("radar_chat_history", JSON.stringify(messages))
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const pending = sessionStorage.getItem("radar_pending_chat")
    if (pending) {
      sessionStorage.removeItem("radar_pending_chat")
      handleSend(pending)
    }
  }, [])

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
    } catch {
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
    <div className="flex flex-col h-full w-full relative">
      {/* Chat History */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto flex flex-col gap-6 px-0 pb-4 scrollbar-thin scrollbar-thumb-[#273647] scrollbar-track-transparent"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center gap-4 py-8 flex-1">
            <div className="w-16 h-16 rounded-full bg-[#1f1f26] flex items-center justify-center border border-[#d0bcff]/20">
              <Icon name="smart_toy" size={32} className="text-[#d0bcff]" />
            </div>
            <div className="text-center max-w-[280px]">
              <h2 className="text-[17px] font-[500] text-[#e4e1eb] font-display">AI Intelligence</h2>
              <p className="text-[12px] font-[500] text-[#cbc3d7] mt-1">
                Ask me anything about market sentiment, token safety, or project analysis.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="px-3 py-1 bg-[#2a2931] rounded-full text-[11px] font-[500] text-[#d0bcff] border border-[#494454]/30">
                Price Analysis
              </span>
              <span className="px-3 py-1 bg-[#2a2931] rounded-full text-[11px] font-[500] text-[#d0bcff] border border-[#494454]/30">
                Risk Check
              </span>
            </div>

            {/* Suggestion Chips */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm pt-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="p-3 text-left rounded-2xl bg-[#1f1f26] hover:bg-[#2a2931] text-[12px] font-[500] text-[#cbc3d7] border border-[#494454]/20 transition-all active:scale-95 cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "user" ? (
                  <div className="bg-[#3f465c] rounded-[18px_18px_4px_18px] max-w-[85%] p-4 shadow-sm">
                    <p className="text-[14px] font-[400] text-[#e4e1eb] leading-relaxed whitespace-pre-line">
                      {m.content}
                    </p>
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-[#cbc3d7]/60">
                        {new Date().getHours().toString().padStart(2, "0")}:
                        {new Date().getMinutes().toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 max-w-[90%]">
                    <div className="bg-[#122131] border border-[#273647] rounded-[18px_18px_18px_4px] max-w-[85%] p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="radar" size={16} className="text-[#d0bcff]" />
                        <span className="text-[11px] font-[600] text-[#d0bcff] uppercase tracking-wider font-display">
                          Radar Analysis
                        </span>
                      </div>
                      <p className="text-[14px] font-[400] text-[#e4e1eb] leading-relaxed whitespace-pre-line">
                        {m.content}
                      </p>
                      <div className="flex justify-start mt-2">
                        <span className="text-[10px] text-[#cbc3d7]/50">
                          {new Date().getHours().toString().padStart(2, "0")}:
                          {new Date().getMinutes().toString().padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start w-full">
                <div className="bg-[#122131] border border-[#273647] rounded-[18px_18px_18px_4px] px-4 py-3 flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#d0bcff]/60 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-[#d0bcff]/60 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-[#d0bcff]/60 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input Field */}
      <div className="sticky bottom-0 left-0 w-full py-3 bg-[#051424]/80 backdrop-blur-lg border-t border-[#34343c]/10">
        <div className="flex items-center gap-3 bg-[#1f1f26] rounded-full px-4 py-1.5 border border-[#494454]/20 focus-within:border-[#d0bcff]/40 transition-colors">
          <button className="text-[#cbc3d7] hover:text-[#d0bcff] transition-colors border-none bg-transparent cursor-pointer p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(input)
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask about crypto..."
              className="flex-1 bg-transparent border-none text-[14px] text-[#e4e1eb] focus:outline-none placeholder:text-[#cbc3d7]/50 py-2"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-[#cbc3d7]/60 hover:text-[#d0bcff] transition-colors border-none bg-transparent cursor-pointer p-1"
              >
                
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-[#d0bcff] text-[#3c0091] p-2 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg disabled:opacity-50 cursor-pointer border-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Gradient Background Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d0bcff]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-40 left-0 w-48 h-48 bg-[#9b7fed]/10 rounded-full blur-[80px]" />
      </div>
    </div>
  )
}
