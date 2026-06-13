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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return "AI assistant is currently unavailable (API key missing). Please try again later."
  }

  try {
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

    const systemInstruction = 
      "You are a crypto research assistant for Radar, a research layer of the SwiftyEx ecosystem. " +
      "Your job is to provide concise, objective, and high-quality crypto intelligence to SwiftyEx users. " +
      "Be direct, avoid fluff, and focus on metrics like price, volume, liquidity, holder distribution, bundle detection, and risk scoring."

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error("Gemini API HTTP error:", response.status, errText)
      return "AI is temporarily unavailable — please try again."
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    return text || "No response received from AI."
  } catch (e) {
    console.error("askGemini fetch error:", e)
    return "AI is temporarily unavailable — please try again."
  }
}
