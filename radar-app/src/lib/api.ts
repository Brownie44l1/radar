import type { TokenData, ResearchCard, TrendingToken } from "../types"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const initData = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData || ""
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> || {}),
    }

    if (initData) {
      headers["Authorization"] = `tma ${initData}`
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })
    const json = (await res.json()) as { data?: T; error?: unknown }
    if (json.error) {
      console.error("API error details:", json.error)
      return null
    }
    return (json.data as T) || null
  } catch (e) {
    console.error("API request failed:", e)
    return null
  }
}

export const api = {
  searchToken: (query: string) => request<TokenData[]>(`/token/search/${encodeURIComponent(query)}`),
  getToken: (address: string, chain: string = "solana") => request<ResearchCard>(`/token/${address}?chain=${chain}`),
  getTrending: () => request<TrendingToken[]>("/trending"),
  chat: (message: string, history: { role: string; content: string }[]) =>
    request<string>("/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
  setAlert: (tokenAddress: string, targetPrice: number, tokenSymbol?: string, tokenChain: string = "solana") =>
    request<unknown>("/alerts", {
      method: "POST",
      body: JSON.stringify({ tokenAddress, targetPrice, tokenSymbol, tokenChain }),
    }),
  submitWallet: (walletAddress: string, reason?: string) =>
    request<unknown>("/wallets/submit", { method: "POST", body: JSON.stringify({ walletAddress, reason }) }),
}
