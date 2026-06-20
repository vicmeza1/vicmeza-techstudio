import type { Series, SeriesStatus } from './types'

const DEMO_DATA: Series[] = [
  { id: 'demo1', title: 'Breaking Bad',     status: 'pendiente', platform: 'Netflix',  currentSeason: null, currentEpisode: null, watchedWithPau: false, notes: '', lastWatched: null, updatedAt: '2026-01-01' },
  { id: 'demo2', title: 'The Last of Us',   status: 'pendiente', platform: 'HBO',      currentSeason: null, currentEpisode: null, watchedWithPau: false, notes: '', lastWatched: null, updatedAt: '2026-01-01' },
  { id: 'demo3', title: 'Stranger Things',  status: 'pendiente', platform: 'Netflix',  currentSeason: null, currentEpisode: null, watchedWithPau: false, notes: '', lastWatched: null, updatedAt: '2026-01-01' },
  { id: 'demo4', title: 'Narcos',           status: 'pendiente', platform: 'Netflix',  currentSeason: null, currentEpisode: null, watchedWithPau: false, notes: '', lastWatched: null, updatedAt: '2026-01-01' },
  { id: 'demo5', title: 'Squid Game',       status: 'pendiente', platform: 'Netflix',  currentSeason: null, currentEpisode: null, watchedWithPau: false, notes: '', lastWatched: null, updatedAt: '2026-01-01' },
]

const SERIES_KEY      = 'series_tracker_v1'
const TMDB_KEY        = 'series_tracker_tmdb_key'
const ANTHROPIC_KEY   = 'series_tracker_anthropic_key'
const MIGRATIONS_KEY  = 'series_tracker_migrations_v1'

function hasMigration(id: string): boolean {
  try { return (JSON.parse(localStorage.getItem(MIGRATIONS_KEY) || '[]') as string[]).includes(id) }
  catch { return false }
}
function markMigration(id: string) {
  try {
    const done = JSON.parse(localStorage.getItem(MIGRATIONS_KEY) || '[]') as string[]
    localStorage.setItem(MIGRATIONS_KEY, JSON.stringify([...done, id]))
  } catch { /* ignore */ }
}

function titleCase(str: string) {
  return str.replace(/(?:^|\s)\S/g, c => c.toUpperCase())
}

function newId() { return Math.random().toString(36).slice(2, 10) }

// 29 series from Excel audit missing from app (2026-06-19)
const EXCEL_IMPORT: Array<{
  title: string; status: SeriesStatus; platform: string | null
  season: number | null; lastWatched: string | null; watchedWithPau: boolean; notes: string
}> = [
  { title: 'Dutton Ranch',          status: 'viendo',   platform: 'Paramount+', season: 1,    lastWatched: '2026-06-18', watchedWithPau: false, notes: 'Spin-off universo Yellowstone' },
  { title: 'El Swing Perfecto',     status: 'pendiente', platform: 'Netflix',   season: null, lastWatched: null,         watchedWithPau: false, notes: 'Vista con Kikis' },
  { title: 'The Last Swing',        status: 'pendiente', platform: null,        season: null, lastWatched: null,         watchedWithPau: false, notes: 'Visto con Kikis' },
  { title: 'Nemesis',               status: 'completa',  platform: 'Netflix',   season: 1,    lastWatched: '2023-11-01', watchedWithPau: false, notes: '' },
  { title: 'Cabo de Miedo',         status: 'pausada',   platform: 'Apple TV',  season: null, lastWatched: null,         watchedWithPau: true,  notes: '' },
  { title: 'Sabes Quién Es?',       status: 'completa',  platform: null,        season: null, lastWatched: '2023-11-01', watchedWithPau: false, notes: '' },
  { title: 'Pluribus',              status: 'completa',  platform: 'Apple TV',  season: 1,    lastWatched: null,         watchedWithPau: false, notes: '' },
  { title: 'Ciudad de Sombras',     status: 'completa',  platform: 'Netflix',   season: 1,    lastWatched: null,         watchedWithPau: false, notes: '' },
  { title: 'Departure: Vuelo 176',  status: 'completa',  platform: null,        season: 1,    lastWatched: null,         watchedWithPau: false, notes: '' },
  { title: 'El Jardinero',          status: 'completa',  platform: null,        season: 1,    lastWatched: null,         watchedWithPau: false, notes: '' },
  { title: 'La Residencia',         status: 'completa',  platform: null,        season: 1,    lastWatched: null,         watchedWithPau: false, notes: '' },
  { title: 'El Tirador (Shooter)',  status: 'completa',  platform: null,        season: 3,    lastWatched: '2018-09-18', watchedWithPau: false, notes: '' },
  { title: 'Jack Taylor',           status: 'completa',  platform: null,        season: 1,    lastWatched: '2018-03-31', watchedWithPau: false, notes: '' },
  { title: 'The Boss',              status: 'completa',  platform: null,        season: 2,    lastWatched: '2014-06-01', watchedWithPau: false, notes: '' },
  { title: '24 Live Another Day',   status: 'completa',  platform: null,        season: 9,    lastWatched: '2015-04-01', watchedWithPau: false, notes: '' },
  { title: 'Under the Dome',        status: 'completa',  platform: null,        season: 1,    lastWatched: '2015-01-25', watchedWithPau: false, notes: '' },
  { title: 'Covert Affairs',        status: 'completa',  platform: null,        season: 1,    lastWatched: '2015-02-25', watchedWithPau: false, notes: '' },
  { title: 'True Detective',        status: 'completa',  platform: null,        season: 1,    lastWatched: '2015-06-15', watchedWithPau: false, notes: '' },
  { title: 'The West Wing',         status: 'completa',  platform: null,        season: 1,    lastWatched: '2015-06-16', watchedWithPau: false, notes: '' },
  { title: 'The Good Wife',         status: 'completa',  platform: null,        season: 1,    lastWatched: '2015-06-16', watchedWithPau: false, notes: '' },
  { title: 'Lie to Me',             status: 'completa',  platform: null,        season: 1,    lastWatched: '2013-08-15', watchedWithPau: false, notes: '' },
  { title: 'Revenge',               status: 'completa',  platform: null,        season: 2,    lastWatched: '2013-08-15', watchedWithPau: false, notes: '' },
  { title: 'Walking Dead',          status: 'completa',  platform: null,        season: 5,    lastWatched: '2016-05-14', watchedWithPau: false, notes: '' },
  { title: 'Reign',                 status: 'completa',  platform: null,        season: 3,    lastWatched: '2016-04-18', watchedWithPau: false, notes: '' },
  { title: '24 Legacy',             status: 'completa',  platform: null,        season: 1,    lastWatched: '2017-02-23', watchedWithPau: false, notes: '' },
  { title: 'Ausente (Absentia)',    status: 'pausada',   platform: 'Netflix',   season: 1,    lastWatched: null,         watchedWithPau: false, notes: '' },
  { title: 'Marco Polo',            status: 'pausada',   platform: null,        season: 1,    lastWatched: '2014-12-19', watchedWithPau: false, notes: '' },
  { title: 'Lucifer',               status: 'pausada',   platform: null,        season: 1,    lastWatched: '2017-09-02', watchedWithPau: false, notes: '' },
  { title: 'Perish',                status: 'pendiente', platform: null,        season: 1,    lastWatched: null,         watchedWithPau: false, notes: '' },
]

export function loadSeries(): Series[] {
  try {
    const raw = localStorage.getItem(SERIES_KEY)
    if (!raw) return DEMO_DATA
    let series: Series[] = JSON.parse(raw)
    let changed = false

    // Migration 1: fix all-lowercase titles + Dutton Ranch status
    const fixed = series.map(s => {
      if (s.title && s.title === s.title.toLowerCase() && /[a-z]/.test(s.title)) {
        changed = true
        return { ...s, title: titleCase(s.title) }
      }
      if (s.title === 'Dutton Ranch' && s.status === 'pendiente') {
        changed = true
        return { ...s, status: 'viendo' as const, lastWatched: '2026-06-18', updatedAt: '2026-06-19' }
      }
      return s
    })
    if (changed) series = fixed

    // Migration 2: inject 29 Excel series (runs once per browser)
    if (!hasMigration('excel-import-2026-06-19')) {
      const existingTitles = new Set(series.map(s => s.title.toLowerCase().trim()))
      const toAdd: Series[] = EXCEL_IMPORT
        .filter(n => !existingTitles.has(n.title.toLowerCase().trim()))
        .map(n => ({
          id: newId(),
          title: n.title,
          status: n.status,
          platform: n.platform,
          currentSeason: n.season,
          currentEpisode: null,
          watchedWithPau: n.watchedWithPau,
          notes: n.notes,
          lastWatched: n.lastWatched,
          updatedAt: '2026-06-19',
        }))
      if (toAdd.length > 0) { series = [...series, ...toAdd]; changed = true }
      markMigration('excel-import-2026-06-19')
    }

    // Migration 3: move all pendiente → pausada so Cola starts empty
    if (!hasMigration('clear-queue-2026-06-19')) {
      series = series.map(s => s.status === 'pendiente' ? { ...s, status: 'pausada' as const } : s)
      changed = true
      markMigration('clear-queue-2026-06-19')
    }

    if (changed) localStorage.setItem(SERIES_KEY, JSON.stringify(series))
    return series
  } catch { /* ignore */ }
  return DEMO_DATA
}

export function saveSeries(series: Series[]): void {
  localStorage.setItem(SERIES_KEY, JSON.stringify(series))
}

// ── Server sync (shared file, all browsers read/write same data) ──────────────

export async function fetchSeriesFromServer(): Promise<Series[] | null> {
  try {
    const res = await fetch('/api/series')
    if (!res.ok) return null
    return await res.json() as Series[]
  } catch { return null }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null
export function saveSeriesServer(series: Series[]): void {
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    fetch('/api/series', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(series),
    }).catch(() => {})
  }, 400)
}

export function loadTmdbKey(): string {
  return localStorage.getItem(TMDB_KEY) ?? ''
}
export function saveTmdbKey(key: string): void {
  localStorage.setItem(TMDB_KEY, key)
}

export function loadAnthropicKey(): string {
  return localStorage.getItem(ANTHROPIC_KEY) ?? ''
}
export function saveAnthropicKey(key: string): void {
  localStorage.setItem(ANTHROPIC_KEY, key)
}
