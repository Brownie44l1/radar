import { cacheGet, cacheSet } from "../cache/redis"

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
    // 1. Get signatures (representing transaction history)
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
    const sigsData = await sigsRes.json()
    if (sigsData.error || !sigsData.result) return false

    const signatures = sigsData.result.map((s: any) => s.signature)
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

    const txs = await txRes.json()
    if (!Array.isArray(txs)) {
      await cacheSet(cacheKey, hasManyTxInSameBlock, 0)
      return hasManyTxInSameBlock
    }

    // Group transactions by slot (block)
    const slotToTxs: Record<number, any[]> = {}
    for (const tx of txs) {
      const slot = tx.slot
      if (!slotToTxs[slot]) slotToTxs[slot] = []
      slotToTxs[slot].push(tx)
    }

    let isBundled = false

    // Check each slot for bundling: 3+ wallets buying from the same funding source/fee payer
    for (const slotStr in slotToTxs) {
      const slotTxs = slotToTxs[slotStr]
      if (slotTxs.length < 3) continue

      const fundingSources: Record<string, number> = {}
      for (const tx of slotTxs) {
        const feePayer = tx.feePayer
        if (feePayer) {
          fundingSources[feePayer] = (fundingSources[feePayer] || 0) + 1
        }

        if (tx.nativeTransfers) {
          for (const transfer of tx.nativeTransfers) {
            const sender = transfer.fromUserAccount
            if (sender) {
              fundingSources[sender] = (fundingSources[sender] || 0) + 1
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
