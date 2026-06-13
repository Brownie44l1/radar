const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    })
    const json = await res.json()
    if (json.error) {
      console.error(json.error)
      return null
    }
    return json.data as T
  } catch (e) {
    console.error("API error:", e)
    return null
  }
}

export const api = {
  searchToken: (query: string) => request<any>(`/token/search/${encodeURIComponent(query)}`),
  getToken: (address: string) => request<any>(`/token/${address}`),
  getTrending: () => request<any>("/trending"),
  chat: (message: string, history: { role: string; content: string }[]) =>
    request<any>("/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
  setAlert: (tokenAddress: string, targetPrice: number) =>
    request<any>("/alerts", { method: "POST", body: JSON.stringify({ tokenAddress, targetPrice }) }),
  submitWallet: (walletAddress: string, reason?: string) =>
    request<any>("/wallets/submit", { method: "POST", body: JSON.stringify({ walletAddress, reason }) }),
}
