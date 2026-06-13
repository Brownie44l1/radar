import { GoogleGenAI } from "@google/genai"

let ai: GoogleGenAI | null = null

function getAIClient(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured")
      return null
    }
    ai = new GoogleGenAI({ apiKey })
  }
  return ai
}

export async function askGemini(
  message: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const client = getAIClient()
  if (!client) {
    return "AI assistant is currently unavailable (API key missing). Please try again later."
  }

  try {
    // Map history to Gemini API format. Gemini uses 'user' and 'model' roles.
    const contents: any[] = []

    for (const turn of history) {
      const role = turn.role === "assistant" || turn.role === "model" ? "model" : "user"
      contents.push({
        role,
        parts: [{ text: turn.content }],
      })
    }

    // Append the new message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    })

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction:
          "You are a crypto research assistant for Radar, a research layer of the SwiftyEx ecosystem. " +
          "Your job is to provide concise, objective, and high-quality crypto intelligence to SwiftyEx users. " +
          "Be direct, avoid fluff, and focus on metrics like price, volume, liquidity, holder distribution, bundle detection, and risk scoring.",
      },
    })

    return response.text || "No response received from AI."
  } catch (e) {
    console.error("askGemini error:", e)
    return "AI is temporarily unavailable — please try again."
  }
}
