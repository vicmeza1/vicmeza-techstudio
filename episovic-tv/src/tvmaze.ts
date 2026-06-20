// TVMaze API — completamente gratis, sin API key
const BASE = 'https://api.tvmaze.com'

export const TVMAZE_IMG_M = '' // prefixed in response already

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Nombre en español México → alternativas de búsqueda en inglés/original
const ALIASES: Record<string, string[]> = {
  'juego del calamar': ['squid game'],
  'la casa de papel': ['money heist'],
  'el problema de los 3 cuerpos': ['3 body problem'],
  'quien mato a sara': ['who killed sara'],
  'detras de sus ojos': ['behind her eyes'],
  'el diablo de al lado': ['the devil next door'],
  'el espia': ['the spy'],
  'perros de berlin': ['4 blocks'],
  'los asesinatos de valhalla': ['the valhalla murders'],
  'cross detective': ['cross', 'alex cross'],
  'adolescencia': ['adolescence'],
  'frente costero': ['shoreline'],
  'ciudad de sombras': ['shadowplay', 'city of shadows'],
  'ausente absentia': ['absentia'],
  'ciudad en llamas': ['city on fire'],
  'el jardinero': ['the gardener'],
  'palomas negras': ['black doves'],
  'la treve': ['the break'],
  'atrapados': ['trapped'],
  'el turista': ['the tourist'],
  'mano de hierro': ['iron fist'],
  'traicion': ['treason'],
  'enganos': ['deceived', 'betrayal'],
  'una familia normal': ['a normal family'],
  'amigos y vecinos': ['friends & neighbours', 'friends and neighbours'],
}

function normKey(title: string): string {
  return title.toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface TVMazeShow {
  id: number
  name: string
  image: { medium: string; original: string } | null
  summary: string | null
  genres: string[]
  status: string // 'Running' | 'Ended' | ...
  network: { name: string } | null
  webChannel: { name: string } | null
  rating?: { average: number | null }
  _embedded?: {
    nextepisode?: {
      season: number
      number: number
      airdate: string
      name: string
    }
  }
}

interface TVMazeResult {
  score: number
  show: TVMazeShow
}

async function searchQuery(q: string): Promise<TVMazeShow | null> {
  try {
    const res = await fetch(`${BASE}/search/shows?q=${encodeURIComponent(q)}`)
    if (!res.ok) return null
    const results: TVMazeResult[] = await res.json()
    return results[0]?.show ?? null
  } catch {
    return null
  }
}

async function getShowDetail(id: number): Promise<TVMazeShow | null> {
  try {
    const res = await fetch(`${BASE}/shows/${id}?embed=nextepisode`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export interface TVMazeData {
  tvmazeId: number
  posterPath: string | null
  overview: string
  genres: string[]
  nextAirDate: string | null
  nextSeasonNumber: number | null
  totalSeasons: number | null
  titleEs: string | null
  publicRating: number | null
}

export async function fetchTitleEs(id: number): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/shows/${id}/akas`)
    if (!res.ok) return null
    const akas: Array<{ name: string; country: { code: string } | null }> = await res.json()
    // Prefer Mexico, then other Spanish-speaking countries
    for (const code of ['MX', 'ES', 'AR', 'CO', 'CL', 'PE']) {
      const match = akas.find(a => a.country?.code === code)
      if (match) return match.name
    }
    return null
  } catch {
    return null
  }
}

export async function fetchShowById(id: number): Promise<TVMazeData | null> {
  const [detail, titleEs] = await Promise.all([getShowDetail(id), fetchTitleEs(id)])
  if (!detail) return null
  const next = detail._embedded?.nextepisode
  return {
    tvmazeId: detail.id,
    posterPath: detail.image?.medium ?? null,
    overview: detail.summary ? stripHtml(detail.summary) : '',
    genres: detail.genres ?? [],
    nextAirDate: next?.airdate ?? null,
    nextSeasonNumber: next?.season ?? null,
    totalSeasons: null,
    titleEs,
    publicRating: detail.rating?.average ?? null,
  }
}

export async function fetchShowData(title: string): Promise<TVMazeData | null> {
  const key = normKey(title)

  // 1. Direct search
  let show = await searchQuery(title)

  // 2. Try without article
  if (!show?.summary) {
    const noArticle = title.replace(/^(el|la|los|las|un|una|the)\s+/i, '')
    if (noArticle !== title) show = await searchQuery(noArticle) ?? show
  }

  // 3. Try known aliases
  if (!show?.summary) {
    const aliases = ALIASES[key]
    if (aliases) {
      for (const alias of aliases) {
        const found = await searchQuery(alias)
        if (found?.summary) { show = found; break }
      }
    }
  }

  if (!show) return null

  // Get full detail + AKAs in parallel
  const [detail, titleEs] = await Promise.all([
    getShowDetail(show.id),
    fetchTitleEs(show.id),
  ])
  const s = detail ?? show

  const next = s._embedded?.nextepisode
  return {
    tvmazeId: s.id,
    posterPath: s.image?.medium ?? null,
    overview: s.summary ? stripHtml(s.summary) : '',
    genres: s.genres ?? [],
    nextAirDate: next?.airdate ?? null,
    nextSeasonNumber: next?.season ?? null,
    totalSeasons: null,
    titleEs,
    publicRating: s.rating?.average ?? null,
  }
}
