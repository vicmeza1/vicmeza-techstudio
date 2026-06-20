import type { Series, SeriesStatus } from './types'

export type NLPAction =
  | { type: 'update_status'; id: string; status: SeriesStatus; title: string }
  | { type: 'update_progress'; id: string; season: number | null; episode: number | null; platform?: string; title: string }
  | { type: 'add'; title: string; season?: number; platform?: string }
  | { type: 'delete'; id: string; title: string }
  | { type: 'unknown'; input: string }

const PLATFORMS = ['netflix', 'apple tv', 'apple', 'hbo', 'prime', 'amazon', 'disney', 'paramount', 'peacock', 'star', 'hulu', 'mubi', 'crunchyroll', 'vix']

function normTitle(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function findSeries(input: string, series: Series[]): Series | null {
  const norm = normTitle(input)
  // exact match first
  let found = series.find(s => normTitle(s.title) === norm)
  if (found) return found
  // contained in
  found = series.find(s => norm.includes(normTitle(s.title)) || normTitle(s.title).includes(norm))
  if (found) return found
  // word overlap
  const words = norm.split(/\s+/).filter(w => w.length > 2)
  let best: Series | null = null
  let bestScore = 0
  for (const s of series) {
    const titleWords = normTitle(s.title).split(/\s+/)
    const score = words.filter(w => titleWords.some(tw => tw.includes(w) || w.includes(tw))).length
    if (score > bestScore) { bestScore = score; best = s }
  }
  return bestScore >= 1 ? best : null
}

function extractNumber(text: string, keyword: string): number | null {
  const re = new RegExp(`(?:${keyword})[s\\s]*([0-9]+)`, 'i')
  const m = text.match(re)
  return m ? parseInt(m[1]) : null
}

function extractPlatform(text: string): string | null {
  for (const p of PLATFORMS) {
    if (text.toLowerCase().includes(p)) {
      if (p === 'apple') return 'Apple TV'
      if (p === 'amazon') return 'Prime'
      return p.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
    }
  }
  return null
}

function stripPlatformAndKeywords(text: string): string {
  let t = text
  for (const p of PLATFORMS) t = t.replace(new RegExp(p, 'gi'), '')
  const stop = [
    'termine', 'termino', 'acabe', 'acabo', 'vi', 'visto', 'ya vi', 'completé', 'complete', 'complete',
    'estoy viendo', 'empecé', 'empece', 'empece a ver', 'empecé a ver', 'voy en', 'estoy en',
    'quiero ver', 'añade', 'anade', 'agrega', 'nueva serie', 'borra', 'elimina', 'quita',
    'pausa', 'pausé', 'pause', 'temporada', 'episodio', 'cap', 'capitulo', 'en',
    'a', 'de', 'la', 'el', 'los', 'las', 'serie',
  ]
  for (const kw of stop) t = t.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '')
  return t.replace(/\s{2,}/g, ' ').trim()
}

export function parseCommand(input: string, series: Series[]): NLPAction {
  const raw = input.trim()
  const low = raw.toLowerCase()

  // DELETE
  if (/\b(borra|elimina|quita|remove)\b/i.test(low)) {
    const cleaned = low.replace(/\b(borra|elimina|quita|remove)\b/i, '').trim()
    const found = findSeries(cleaned, series)
    if (found) return { type: 'delete', id: found.id, title: found.title }
  }

  // COMPLETE
  if (/\b(termin[eéo]|acab[eéo]|ya vi|complet[eéo]|visto|vista)\b/i.test(low)) {
    const cleaned = stripPlatformAndKeywords(low)
    const found = findSeries(cleaned, series)
    if (found) return { type: 'update_status', id: found.id, status: 'completa', title: found.title }
  }

  // WATCHING / PROGRESS UPDATE
  const isWatching = /\b(estoy viendo|empec[eé]|voy en|estoy en|continu[oó])\b/i.test(low)
  const hasSeason = /\b(temporada|season|temp|s\d)\b/i.test(low)
  const hasEpisode = /\b(episodio|ep|cap[ií]tulo|e\d)\b/i.test(low)

  if (isWatching || hasSeason || hasEpisode) {
    const season = extractNumber(low, 'temporada|season|temp|s') ??
                   (() => { const m = low.match(/\bs(\d+)\b/); return m ? parseInt(m[1]) : null })()
    const episode = extractNumber(low, 'episodio|ep|cap[ií]tulo|e') ??
                    (() => { const m = low.match(/\be(\d+)\b/); return m ? parseInt(m[1]) : null })()
    const platform = extractPlatform(low) ?? undefined
    const cleaned = stripPlatformAndKeywords(low)
    const found = findSeries(cleaned, series)
    if (found) {
      return { type: 'update_progress', id: found.id, season, episode, platform, title: found.title }
    }
  }

  // PAUSE
  if (/\b(paus[eéo]|dejé|deje|paré|pare)\b/i.test(low)) {
    const cleaned = stripPlatformAndKeywords(low)
    const found = findSeries(cleaned, series)
    if (found) return { type: 'update_status', id: found.id, status: 'pausada', title: found.title }
  }

  // ABANDON
  if (/\b(abandon[eéo]|aburri[oó]|ya no|perdi.*(inter[eé]s)|no (la|lo) (sigo|continuo))\b/i.test(low)) {
    const cleaned = stripPlatformAndKeywords(low)
    const found = findSeries(cleaned, series)
    if (found) return { type: 'update_status', id: found.id, status: 'abandonada', title: found.title }
  }

  // WANT TO WATCH / ADD
  if (/\b(quiero ver|a[ñn]ade|agrega|nueva serie|add)\b/i.test(low)) {
    const cleaned = raw.replace(/\b(quiero ver|a[ñn]ade|agrega|nueva serie|add)\b/gi, '').trim()
    const platform = extractPlatform(cleaned) ?? undefined
    const title = cleaned.replace(new RegExp(platform ?? '', 'gi'), '').replace(/\ben\b/gi, '').trim()
    if (title.length > 1) return { type: 'add', title, platform }
  }

  return { type: 'unknown', input: raw }
}

export function describeAction(action: NLPAction): string {
  switch (action.type) {
    case 'update_status':
      if (action.status === 'completa') return `✓ Marcar "${action.title}" como completada`
      if (action.status === 'pausada') return `⏸ Pausar "${action.title}"`
      if (action.status === 'abandonada') return `✕ Abandonar "${action.title}"`
      return `Actualizar estado de "${action.title}"`
    case 'update_progress': {
      const parts = [`"${action.title}"`]
      if (action.season) parts.push(`temporada ${action.season}`)
      if (action.episode) parts.push(`episodio ${action.episode}`)
      if (action.platform) parts.push(`en ${action.platform}`)
      return `▶ Actualizar progreso: ${parts.join(', ')}`
    }
    case 'add':
      return `+ Agregar "${action.title}"${action.platform ? ` en ${action.platform}` : ''}`
    case 'delete':
      return `✕ Eliminar "${action.title}"`
    default:
      return 'No entendí el comando. Intenta: "terminé Breaking Bad", "empecé Severance temporada 2 en Apple TV"'
  }
}
