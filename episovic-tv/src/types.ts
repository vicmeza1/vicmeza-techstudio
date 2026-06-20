export type SeriesStatus = 'viendo' | 'completa' | 'pendiente' | 'pausada' | 'abandonada'

export interface Series {
  id: string
  title: string
  currentSeason: number | null
  currentEpisode: number | null
  status: SeriesStatus
  platform: string | null
  watchedWithPau: boolean
  notes: string
  lastWatched: string | null
  updatedAt?: string | null
  // TVMaze enrichment (cargado sin API key)
  tvmazeId?: number
  posterPath?: string
  overview?: string
  nextAirDate?: string | null
  nextSeasonNumber?: number | null
  genres?: string[]
  titleEs?: string | null
  rating?: number       // 1–5 estrellas, undefined = sin calificar
  publicRating?: number | null  // calificación TVMaze (0–10)
}

export interface AppFilter {
  status: 'all' | SeriesStatus
  platform: string
  search: string
}

export type SortOrder = 'recent' | 'oldest' | 'az' | 'za' | 'platform' | 'platform-desc' | 'status' | 'episode' | 'rating' | 'rating-asc'

export type SectionKey = 'viendo' | 'pendiente' | 'nueva-temporada' | 'completa' | 'pausada' | 'abandonada'
