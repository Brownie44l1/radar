import { cacheGet, cacheSet } from "../cache/redis"

interface SigResult {
  signature: string
  slot: number
}

interface HeliusTx {
  slot: number
  feePayer?: string
  nativeTransfers?: { fromUserAccount?: string }[]
}

export async function detectBundle(address: string): Promise<boolean | null> {
  const cacheKey = `bundle:${address.toLowerCase()}`
  const cached = await cacheGet<boolean>(cacheKey)
  if (cached !== null) return cached

  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) {
    console.warn("HELIUS_API_KEY is not configured")
    return false
  }

  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`

  try {
    const sigsRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "get-signatures",
        method: "getSignaturesForAddress",
        params: [address, { limit: 50 }],
      }),
    })

    if (!sigsRes.ok) return false
    const sigsData = await sigsRes.json() as { result?: SigResult[]; error?: { message: string } }
    if (sigsData.error || !sigsData.result) return false

    const signatures = sigsData.result.map((s) => s.signature)
    if (signatures.length === 0) return false

    // Group signatures by slot as an initial heuristic
    const slotGroups: Record<number, number> = {}
    for (const sig of sigsData.result) {
      slotGroups[sig.slot] = (slotGroups[sig.slot] || 0) + 1
    }
    const hasManyTxInSameBlock = Object.values(slotGroups).some((count) => count >= 3)

    // 2. Query detailed transactions using Helius Enhanced API
    const txRes = await fetch(`https://api.helius.xyz/v0/transactions?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: signatures }),
    })

    if (!txRes.ok) {
      // Fallback: If the Enhanced API fails, use slot-grouping heuristic
      await cacheSet(cacheKey, hasManyTxInSameBlock, 0)
      return hasManyTxInSameBlock
    }

    const txs = await txRes.json() as HeliusTx[]
    if (!Array.isArray(txs)) {
      await cacheSet(cacheKey, hasManyTxInSameBlock, 0)
      return hasManyTxInSameBlock
    }

    const slotToTxs = new Map<number, HeliusTx[]>()
    for (const tx of txs) {
      const list = slotToTxs.get(tx.slot) ?? []
      list.push(tx)
      slotToTxs.set(tx.slot, list)
    }

    let isBundled = false

    for (const slotTxs of slotToTxs.values()) {
      if (slotTxs.length < 3) continue

      const fundingSources: Record<string, number> = {}
      for (const tx of slotTxs) {
        const feePayer = tx.feePayer
        if (feePayer) {
          fundingSources[feePayer] = (fundingSources[feePayer] ?? 0) + 1
        }

        if (tx.nativeTransfers) {
          for (const transfer of tx.nativeTransfers) {
            const sender = transfer.fromUserAccount
            if (sender) {
              fundingSources[sender] = (fundingSources[sender] ?? 0) + 1
            }
          }
        }
      }

      const maxTxsFromSameSource = Math.max(...Object.values(fundingSources), 0)
      if (maxTxsFromSameSource >= 3) {
        isBundled = true
        break
      }
    }

    await cacheSet(cacheKey, isBundled, 0) // Cache indefinitely
    return isBundled
  } catch (e) {
    console.error("detectBundle error:", e)
    return false
  }
}
