import type { Series } from './types'

const BASE = 'https://api.themoviedb.org/3'
export const IMG = 'https://image.tmdb.org/t/p/w342'
export const IMG_BG = 'https://image.tmdb.org/t/p/w1280'

// Known Mexican Spanish → international title mappings
const TITLE_ALIASES: Record<string, string[]> = {
  'juego del calamar': ['squid game'],
  'la casa de papel': ['money heist'],
  'el problema de los 3 cuerpos': ['3 body problem', 'the three-body problem'],
  'quien mato a sara': ['who killed sara'],
  'los asesinatos de valhalla': ['the valhalla murders'],
  'perros de berlin': ['4 blocks'],
  'detras de sus ojos': ['behind her eyes'],
  'el diablo de al lado': ['the devil next door'],
  'el espia': ['the spy'],
  'la linea sombra del narco': ['the line'],
  'cross detective': ['cross', 'alex cross'],
  'fubar': ['fubar'],
  'adolescencia': ['adolescence'],
  'frente costero': ['shoreline'],
  'mano de hierro': ['iron fist', 'mano de hierro'],
  'ciudad de sombras': ['city of shadows', 'shadowplay'],
  'ausente absentia': ['absentia'],
  'ciudades en llamas': ['city on fire'],
  'el jardinero': ['the gardener'],
  'el legado': ['the legacy', 'legacies'],
  'palomas negras': ['dark doves', 'palomitas'],
  'la treve': ['the break'],
  'atrapados': ['trapped'],
  'el turista': ['the tourist'],
}

function normSearch(title: string): string {
  return title.toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface TMDBShow {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  number_of_seasons: number
  genres: { id: number; name: string }[]
  origin_country: string[]
  next_episode_to_air: { season_number: number; air_date: string; name: string } | null
  status: string
  vote_average: number
  first_air_date: string
}

interface TMDBResult {
  id: number
  name: string
  original_name: string
  poster_path: string | null
  overview: string
  first_air_date: string
}

async function tmdbGet<T>(path: string, apiKey: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${BASE}${path}${sep}api_key=${apiKey}&language=es-MX`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

async function searchByQuery(query: string, apiKey: string): Promise<TMDBResult | null> {
  const data = await tmdbGet<{ results: TMDBResult[] }>(
    `/search/tv?query=${encodeURIComponent(query)}&region=MX`,
    apiKey
  )
  return data.results[0] ?? null
}

async function findShow(title: string, apiKey: string): Promise<TMDBResult | null> {
  const norm = normSearch(title)

  // 1. Direct search in es-MX
  let result = await searchByQuery(title, apiKey)
  if (result?.overview) return result

  // 2. Try without common Spanish articles at the start
  const withoutArticle = title.replace(/^(el|la|los|las|un|una|the)\s+/i, '')
  if (withoutArticle !== title) {
    result = await searchByQuery(withoutArticle, apiKey)
    if (result?.overview) return result
  }

  // 3. Try known Mexican aliases
  const aliases = TITLE_ALIASES[norm]
  if (aliases) {
    for (const alias of aliases) {
      result = await searchByQuery(alias, apiKey)
      if (result?.overview) return result
    }
  }

  // 4. Try English search (no language param) for broad coverage
  const sep = '?'
  const urlEn = `${BASE}/search/tv${sep}api_key=${apiKey}&query=${encodeURIComponent(title)}&language=en-US`
  try {
    const dataEn = await fetch(urlEn).then(r => r.json()) as { results: TMDBResult[] }
    if (dataEn.results[0]) {
      // Re-fetch with es-MX to get Spanish overview
      const enResult = dataEn.results[0]
      const detailEs = await tmdbGet<TMDBShow>(`/tv/${enResult.id}`, apiKey)
      return { ...enResult, overview: detailEs.overview || enResult.overview }
    }
  } catch { /* continue */ }

  return result
}

export async function enrichSeries(series: Series, apiKey: string): Promise<Series> {
  try {
    const found = await findShow(series.title, apiKey)
    if (!found) return series

    const details = await tmdbGet<TMDBShow>(`/tv/${found.id}`, apiKey)

    return {
      ...series,
      tvmazeId: found.id,
      posterPath: details.poster_path ?? found.poster_path ?? series.posterPath,
      overview: details.overview || found.overview || series.overview,
      genres: details.genres?.map(g => g.name) ?? series.genres,
      nextAirDate: details.next_episode_to_air?.air_date ?? null,
      nextSeasonNumber: details.next_episode_to_air?.season_number ?? null,
    }
  } catch {
    return series
  }
}

export async function checkNewSeasons(allSeries: Series[], apiKey: string): Promise<Series[]> {
  // Process in batches of 5 to avoid rate limiting
  const results: Series[] = []
  const batchSize = 5
  for (let i = 0; i < allSeries.length; i += batchSize) {
    const batch = allSeries.slice(i, i + batchSize)
    const enriched = await Promise.all(batch.map(s => enrichSeries(s, apiKey)))
    results.push(...enriched)
    if (i + batchSize < allSeries.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }
  return results
}
