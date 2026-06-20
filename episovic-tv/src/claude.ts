// Fallback: use Claude API to generate a description for series not found on TMDB
export async function generateDescription(title: string, anthropicKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `Escribe en español mexicano una descripción de 1-2 oraciones de la serie de TV "${title}". Solo la descripción breve, sin introducción ni comillas.`
      }]
    })
  })

  if (!res.ok) throw new Error(`Claude API ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? ''
}

// Generate descriptions for series that have no overview
export async function fillMissingDescriptions(
  series: { id: string; title: string; overview?: string }[],
  anthropicKey: string,
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, string>> {
  const missing = series.filter(s => !s.overview || s.overview.trim().length < 20)
  const result = new Map<string, string>()

  for (let i = 0; i < missing.length; i++) {
    const s = missing[i]
    try {
      const desc = await generateDescription(s.title, anthropicKey)
      if (desc) result.set(s.id, desc)
    } catch { /* skip */ }
    onProgress?.(i + 1, missing.length)
    if (i < missing.length - 1) await new Promise(r => setTimeout(r, 200))
  }

  return result
}
