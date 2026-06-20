import { useState, useMemo, useEffect } from 'react'
import type { Series, SortOrder, SectionKey } from './types'
import { loadSeries, saveSeries, loadAnthropicKey, saveAnthropicKey, fetchSeriesFromServer, saveSeriesServer } from './storage'
import { loadConfig, saveConfig } from './config'
import type { AppConfig } from './config'
import { initialData } from './data'
import { fetchShowData, fetchTitleEs } from './tvmaze'
import { fillMissingDescriptions } from './claude'
import { parseCommand } from './nlp'
import { SeriesRow } from './components/SeriesRow'
import { SeriesModal } from './components/SeriesModal'
import { SettingsModal } from './components/SettingsModal'
import { OnboardingModal } from './components/OnboardingModal'
import { ChatPanel } from './components/ChatPanel'
import type { SeriesUpdate, SeriesAddition, ConfigUpdate } from './claude-chat'
import ShaderWallpaper from './ShaderWallpaper'

function newId() { return Math.random().toString(36).slice(2, 10) }
function today() { return new Date().toISOString().slice(0, 10) }
function toTitleCase(str: string) {
  return str.replace(/(?:^|\s)\S/g, c => c.toUpperCase())
}

const DEFAULT_ORDER: SectionKey[] = ['viendo', 'pendiente', 'nueva-temporada', 'completa', 'pausada', 'abandonada']

const SECTION_META: Record<SectionKey, { title: string; accent: string; btnColor: string }> = {
  viendo:            { title: 'Ahora',              accent: 'text-blue-400',    btnColor: '#60a5fa' },
  pendiente:         { title: 'Cola',               accent: 'text-violet-400',  btnColor: '#a78bfa' },
  'nueva-temporada': { title: '🔔 Nueva temporada', accent: 'text-amber-400',   btnColor: '#fbbf24' },
  completa:          { title: 'Vistas',              accent: 'text-emerald-400', btnColor: '#34d399' },
  pausada:           { title: 'En pausa',           accent: 'text-orange-400',  btnColor: '#fb923c' },
  abandonada:        { title: 'Abandonadas',        accent: 'text-rose-400',    btnColor: '#fb7185' },
}

const PLATFORM_LOGO: Record<string, { bg: string; fg: string; text: string; fw?: number; ls?: string; ff?: string }> = {
  'Netflix':    { bg: '#E50914', fg: '#fff',    text: 'NETFLIX',   fw: 900, ls: '0.04em' },
  'Apple TV':   { bg: '#1c1c1e', fg: '#f5f5f7', text: 'Apple TV+', fw: 500, ff: '-apple-system, BlinkMacSystemFont, sans-serif' },
  'HBO':        { bg: '#1a1a1a', fg: '#c8c8c8', text: 'HBO',       fw: 700, ls: '0.08em' },
  'Prime':      { bg: '#0F1111', fg: '#00A8E0', text: 'prime',     fw: 400 },
  'Disney+':    { bg: '#0B0E31', fg: '#fff',    text: 'DISNEY+',   fw: 800, ls: '0.03em' },
  'Paramount+': { bg: '#003dcc', fg: '#fff',    text: 'P+',        fw: 700 },
  'Hulu':       { bg: '#0d0d0d', fg: '#1CE783', text: 'hulu',      fw: 600 },
  'Star+':      { bg: '#1a0030', fg: '#bf73f0', text: 'Star+',     fw: 700 },
  'Peacock':    { bg: '#0d0d0d', fg: '#d0d0d0', text: 'PEACOCK',   fw: 600, ls: '0.04em' },
  'FX':         { bg: '#111',    fg: '#fff',    text: 'FX',        fw: 800, ls: '0.12em' },
  'Mubi':       { bg: '#0d0d0d', fg: '#00C9B1', text: 'MUBI',      fw: 700, ls: '0.06em' },
  'VIX':        { bg: '#0a0a0a', fg: '#FF3300', text: 'VIX',       fw: 800, ls: '0.04em' },
}

function PlatformLogo({ name }: { name: string }) {
  const s = PLATFORM_LOGO[name]
  if (!s) return null
  return (
    <span
      title={name}
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 8,
        fontWeight: s.fw ?? 700,
        letterSpacing: s.ls ?? '0.01em',
        fontFamily: s.ff ?? 'inherit',
        padding: '2px 4px',
        borderRadius: 3,
        lineHeight: 1.4,
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {s.text}
    </span>
  )
}

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'recent',     label: 'Más reciente' },
  { value: 'oldest',     label: 'Más antigua' },
  { value: 'az',         label: 'A–Z' },
  { value: 'platform',   label: 'Plataforma' },
  { value: 'rating',     label: '★ Más valoradas' },
  { value: 'rating-asc', label: '★ Menos valoradas' },
]

type ColKey = 'date' | 'title' | 'platform' | 'status' | 'episode' | 'rating'

function colClick(col: ColKey, current: SortOrder): SortOrder {
  if (col === 'date')     return current === 'recent' ? 'oldest' : 'recent'
  if (col === 'title')    return current === 'az' ? 'za' : 'az'
  if (col === 'platform') return current === 'platform' ? 'platform-desc' : 'platform'
  if (col === 'status')   return 'status'
  if (col === 'rating')   return current === 'rating' ? 'rating-asc' : 'rating'
  return 'episode'
}

const COL_OF: Record<SortOrder, ColKey> = {
  recent: 'date', oldest: 'date',
  az: 'title', za: 'title',
  platform: 'platform', 'platform-desc': 'platform',
  status: 'status', episode: 'episode',
  rating: 'rating', 'rating-asc': 'rating',
}

function colInd(col: ColKey, sort: SortOrder): string {
  if (COL_OF[sort] !== col) return ''
  return (['oldest', 'za', 'platform-desc'] as SortOrder[]).includes(sort) ? ' ↑' : ' ↓'
}

function sortKey(s: Series) {
  // lastWatched = user-controlled watch date; updatedAt = fallback for unseen series
  return s.lastWatched ?? s.updatedAt ?? ''
}

function sortItems(items: Series[], order: SortOrder): Series[] {
  return [...items].sort((a, b) => {
    const ka = sortKey(a), kb = sortKey(b)
    switch (order) {
      case 'recent': {
        const ad = !!a.lastWatched, bd = !!b.lastWatched
        if (!ad && !bd) return 0
        if (!ad) return 1
        if (!bd) return -1
        return (b.lastWatched!).localeCompare(a.lastWatched!)
      }
      case 'oldest': {
        const ad = !!a.lastWatched, bd = !!b.lastWatched
        if (!ad && !bd) return 0
        if (!ad) return 1
        if (!bd) return -1
        return (a.lastWatched!).localeCompare(b.lastWatched!)
      }
      case 'az':           return a.title.localeCompare(b.title, 'es')
      case 'za':           return b.title.localeCompare(a.title, 'es')
      case 'platform':     return (a.platform ?? 'zzz').localeCompare(b.platform ?? 'zzz')
      case 'platform-desc':return (b.platform ?? '').localeCompare(a.platform ?? '')
      case 'status':       return a.status.localeCompare(b.status)
      case 'episode': {
        const ea = (a.currentSeason ?? 0) * 1000 + (a.currentEpisode ?? 0)
        const eb = (b.currentSeason ?? 0) * 1000 + (b.currentEpisode ?? 0)
        return eb - ea
      }
      case 'rating': {
        const ra = a.rating ?? 0, rb = b.rating ?? 0
        if (!ra && !rb) return 0
        if (!ra) return 1
        if (!rb) return -1
        return rb - ra
      }
      case 'rating-asc': {
        const ra = a.rating ?? 0, rb = b.rating ?? 0
        if (!ra && !rb) return 0
        if (!ra) return 1
        if (!rb) return -1
        return ra - rb
      }
      default: return 0
    }
  })
}

// ── Section component ──────────────────────────────────────────
function Section({
  title, accent, btnColor, items, allSeries, expandedId, onToggle, onUpdate, onEditFull, onDelete,
  collapsed, onCollapseToggle, sort, onSortChange,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDropTarget,
}: {
  title: string
  accent: string
  btnColor: string
  items: Series[]
  allSeries: Series[]
  expandedId: string | null
  onToggle: (id: string) => void
  onUpdate: (s: Series) => void
  onEditFull: (s: Series) => void
  onDelete: (id: string) => void
  collapsed: boolean
  onCollapseToggle: () => void
  sort: SortOrder
  onSortChange: (s: SortOrder) => void
  onDragStart?: React.DragEventHandler
  onDragOver?: React.DragEventHandler
  onDrop?: React.DragEventHandler
  onDragEnd?: () => void
  isDragging?: boolean
  isDropTarget?: boolean
}) {
  if (items.length === 0) return null
  return (
    <section
      className="mb-6"
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ opacity: isDragging ? 0.35 : 1, transition: 'opacity 0.15s' }}
    >
      {isDropTarget && <div className="h-0.5 rounded-full mb-2 mx-2" style={{ background: '#3b82f6' }} />}
      {/* Section header — draggable */}
      <div
        className="flex items-center gap-2 px-2 mb-2 select-none"
        draggable={!!onDragStart}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{ cursor: onDragStart ? 'grab' : 'default' }}
      >
        {onDragStart && <span className="text-zinc-700 text-base leading-none">⠿</span>}
        <span className={`text-xs font-bold uppercase tracking-widest ${accent}`}>{title}</span>
        <span className="text-zinc-800 text-xs tabular-nums">{items.length}</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        {/* Collapse */}
        <button
          onClick={e => { e.stopPropagation(); onCollapseToggle() }}
          className="ticktack text-sm font-bold rounded-full px-3 py-0.5 transition-all hover:scale-125"
          style={{ color: btnColor, background: `${btnColor}22`, border: `1px solid ${btnColor}55` }}
        >
          {collapsed ? '▼' : '▲'}
        </button>
      </div>
      {/* Rows + column headers — hidden when collapsed */}
      {!collapsed && (
        <>
          <div className="flex items-center gap-3 px-3 mb-1 py-1.5 rounded-xl" style={{ paddingLeft: 96 + 12 + 12, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => onSortChange(colClick('title', sort))}
              className="flex-1 text-xs uppercase tracking-widest text-left transition-colors hover:text-white font-mono"
              style={{ color: COL_OF[sort] === 'title' ? '#c084fc' : '#71717a' }}>
              Título{colInd('title', sort)}
            </button>
            <button onClick={() => onSortChange(colClick('rating', sort))}
              className="hidden sm:block text-xs uppercase tracking-widest w-20 text-left transition-colors hover:text-white font-mono"
              style={{ color: COL_OF[sort] === 'rating' ? '#c084fc' : '#71717a' }}>
              ★{colInd('rating', sort)}
            </button>
            <button onClick={() => onSortChange(colClick('platform', sort))}
              className="hidden md:block text-xs uppercase tracking-widest w-24 text-right transition-colors hover:text-white font-mono"
              style={{ color: COL_OF[sort] === 'platform' ? '#c084fc' : '#71717a' }}>
              Plat{colInd('platform', sort)}
            </button>
            <button onClick={() => onSortChange(colClick('status', sort))}
              className="text-xs uppercase tracking-widest w-6 sm:w-28 text-right transition-colors hover:text-white font-mono"
              style={{ color: COL_OF[sort] === 'status' ? '#c084fc' : '#71717a' }}>
              <span className="hidden sm:inline">Estado{colInd('status', sort)}</span>
            </button>
            <button onClick={() => onSortChange(colClick('episode', sort))}
              className="hidden sm:block text-xs uppercase tracking-widest w-20 text-right transition-colors hover:text-white font-mono"
              style={{ color: COL_OF[sort] === 'episode' ? '#c084fc' : '#71717a' }}>
              T·E{colInd('episode', sort)}
            </button>
            <button onClick={() => onSortChange(colClick('date', sort))}
              className="text-xs uppercase tracking-widest w-24 text-right transition-colors hover:text-white font-mono"
              style={{ color: COL_OF[sort] === 'date' ? '#c084fc' : '#71717a' }}>
              Fecha{colInd('date', sort)}
            </button>
            <span className="w-5" />
            <span className="w-6" />
          </div>
          <div className="space-y-0.5">
            {items.map(s => (
              <SeriesRow
                key={s.id}
                series={s}
                allSeries={allSeries}
                expanded={expandedId === s.id}
                onToggle={() => onToggle(s.id)}
                onUpdate={onUpdate}
                onEditFull={() => onEditFull(s)}
                onDelete={onDelete}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const [series, setSeries] = useState<Series[]>(() => loadSeries())
  const [config, setConfig] = useState<AppConfig>(() => loadConfig())
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => loadConfig().defaultSort ?? 'recent')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editSeries, setEditSeries] = useState<Series | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [anthropicKey, setAnthropicKey] = useState(() => loadAnthropicKey())
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [addInput, setAddInput] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionKey>>(
    () => new Set<SectionKey>(loadConfig().collapsedSections ?? ['pendiente'])
  )
  const [sectionSorts, setSectionSorts] = useState<Partial<Record<SectionKey, SortOrder>>>(
    () => loadConfig().sectionSorts ?? {}
  )
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(() => config.sectionOrder ?? DEFAULT_ORDER)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  function showToast(msg: string, ms = 3000) {
    setToast(msg); setTimeout(() => setToast(null), ms)
  }

  function persist(updated: Series[]) {
    setSeries(updated)
    saveSeries(updated)         // localStorage (sync)
    saveSeriesServer(updated)   // server file (async + debounced) → broadcasts to all browsers
  }

  // Server is the single source of truth — all browsers read from / write to the server
  useEffect(() => {
    fetchSeriesFromServer().then(serverData => {
      if (serverData && serverData.length > 0) {
        // Server wins — override whatever was in localStorage
        setSeries(serverData)
        saveSeries(serverData)
      } else {
        // Server has no file yet — this browser bootstraps it (first one to load wins)
        saveSeriesServer(loadSeries())
      }
    })

    // Another browser saved → update this browser instantly
    if (import.meta.hot) {
      import.meta.hot.on('series:sync', (raw: string) => {
        try {
          const incoming: Series[] = JSON.parse(raw)
          setSeries(incoming)
          saveSeries(incoming)
        } catch { /* ignore */ }
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function upsert(s: Series) {
    const stamped = { ...s, updatedAt: today() }
    persist(series.map(x => x.id === s.id ? stamped : x))
    if (editSeries?.id === s.id) setEditSeries(stamped)
  }

  function deleteSeries(id: string) {
    persist(series.filter(s => s.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function toggleSectionCollapse(key: SectionKey) {
    const next = new Set(collapsedSections)
    if (next.has(key)) next.delete(key); else next.add(key)
    setCollapsedSections(next)
    const newConfig = { ...config, collapsedSections: [...next] as SectionKey[] }
    setConfig(newConfig); saveConfig(newConfig)
  }

  function updateSectionSort(key: SectionKey, sort: SortOrder) {
    const next = { ...sectionSorts, [key]: sort }
    setSectionSorts(next)
    const newConfig = { ...config, sectionSorts: next }
    setConfig(newConfig); saveConfig(newConfig)
  }

  function handleToggle(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Bulk TVMaze sync
  async function handleSync() {
    setSyncing(true)
    const todo = series.filter(s => !s.tvmazeId)
    const akaTodo = series.filter(s => s.tvmazeId && s.titleEs === undefined)
    if (todo.length === 0 && akaTodo.length === 0) { showToast('Ya todo está actualizado ✓'); setSyncing(false); return }

    const batchSize = 5
    let updated = [...series]
    let done = 0

    for (let i = 0; i < todo.length; i += batchSize) {
      const batch = todo.slice(i, i + batchSize)
      const results = await Promise.all(batch.map(s => fetchShowData(s.title)))
      results.forEach((data, idx) => {
        if (!data) return
        const target = batch[idx]
        updated = updated.map(s => s.id !== target.id ? s : {
          ...s,
          tvmazeId: data.tvmazeId,
          posterPath: data.posterPath ?? s.posterPath,
          overview: data.overview || s.overview,
          genres: data.genres.length ? data.genres : s.genres,
          nextAirDate: data.nextAirDate,
          nextSeasonNumber: data.nextSeasonNumber,
          titleEs: data.titleEs,
          publicRating: data.publicRating ?? s.publicRating,
        })
        done++
      })
      persist(updated)
      setSyncMsg(`${done}/${todo.length}`)
      if (i + batchSize < todo.length) await new Promise(r => setTimeout(r, 400))
    }

    // Claude fallback for still-missing overviews
    if (anthropicKey) {
      const missing = updated.filter(s => !s.overview || s.overview.length < 20)
      if (missing.length > 0) {
        setSyncMsg(`IA: generando ${missing.length} descripciones...`)
        const descs = await fillMissingDescriptions(missing, anthropicKey,
          (d, t) => setSyncMsg(`IA: ${d}/${t}`))
        updated = updated.map(s => descs.has(s.id) ? { ...s, overview: descs.get(s.id)! } : s)
        persist(updated)
      }
    }

    // Second pass: fetch AKAs for already-synced series missing titleEs
    if (akaTodo.length > 0) {
      setSyncMsg(`Nombres ES: 0/${akaTodo.length}`)
      let akaDone = 0
      for (let i = 0; i < akaTodo.length; i += 8) {
        const batch = akaTodo.slice(i, i + 8)
        const results = await Promise.all(batch.map(s => fetchTitleEs(s.tvmazeId!)))
        results.forEach((titleEs, idx) => {
          const target = batch[idx]
          updated = updated.map(s => s.id !== target.id ? s : { ...s, titleEs: titleEs ?? null })
          akaDone++
        })
        persist(updated)
        setSyncMsg(`Nombres ES: ${akaDone}/${akaTodo.length}`)
        if (i + 8 < akaTodo.length) await new Promise(r => setTimeout(r, 200))
      }
    }

    const withPosters = updated.filter(s => s.posterPath).length
    const withNew = updated.filter(s => s.nextAirDate).length
    const withEs = updated.filter(s => s.titleEs).length
    showToast(`${withPosters} posters · ${withNew} próximas · ${withEs} nombres ES`, 4000)
    setSyncing(false); setSyncMsg('')
  }

  // Enriches a freshly-created series with TVMaze data in background
  function enrichInBackground(id: string, title: string) {
    fetchShowData(title).then(data => {
      if (!data) return
      setSeries(prev => {
        const next = prev.map(s => s.id !== id ? s : {
          ...s,
          tvmazeId:        data.tvmazeId,
          posterPath:      data.posterPath      ?? s.posterPath,
          overview:        data.overview        || s.overview,
          genres:          data.genres?.length  ? data.genres : s.genres,
          nextAirDate:     data.nextAirDate,
          nextSeasonNumber: data.nextSeasonNumber,
          titleEs:         data.titleEs         ?? s.titleEs,
          publicRating:    data.publicRating    ?? s.publicRating,
        })
        saveSeries(next)
        saveSeriesServer(next)
        return next
      })
    })
  }

  // Add series
  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const action = parseCommand(addInput, series)
    if (action.type === 'add') {
      const ns: Series = {
        id: newId(), title: toTitleCase(action.title), currentSeason: action.season ?? null,
        currentEpisode: null, status: 'pendiente', platform: action.platform ?? null,
        watchedWithPau: false, notes: '', lastWatched: null, updatedAt: today(),
      }
      persist([ns, ...series])
      showToast(`Agregada: "${action.title}"`)
      enrichInBackground(ns.id, ns.title)
    } else if (action.type !== 'unknown') {
      const act = action
      if (act.type === 'update_status') {
        persist(series.map(s => s.id === act.id ? { ...s, status: act.status } : s))
        showToast(`"${act.title}" → ${act.status}`)
      } else if (act.type === 'delete') {
        persist(series.filter(s => s.id !== act.id))
        showToast(`Eliminada: "${act.title}"`)
      }
    } else {
      if (addInput.trim().length > 1) {
        const title = toTitleCase(addInput.trim())
        const ns: Series = {
          id: newId(), title, currentSeason: null, currentEpisode: null,
          status: 'pendiente', platform: null, watchedWithPau: false, notes: '', lastWatched: null, updatedAt: today(),
        }
        persist([ns, ...series])
        showToast(`Agregada: "${title}"`)
        enrichInBackground(ns.id, ns.title)
      }
    }
    setAddInput(''); setShowAdd(false)
  }

  async function handleBulkImport() {
    const titles = importText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 1)
    if (titles.length === 0) return

    const existingSet = new Set(series.map(s => s.title.toLowerCase()))
    const fresh = titles.filter(t => !existingSet.has(t.toLowerCase()))
    const dupeCount = titles.length - fresh.length

    if (fresh.length === 0) {
      showToast(dupeCount > 0 ? `Todas ya están en tu lista (${dupeCount})` : 'Sin títulos válidos')
      return
    }

    const created: Series[] = fresh.map(title => ({
      id: newId(), title: toTitleCase(title),
      currentSeason: null, currentEpisode: null,
      status: 'pendiente' as const, platform: null,
      watchedWithPau: false, notes: '', lastWatched: null, updatedAt: today(),
    }))

    persist([...created, ...series])
    setImportText(''); setShowAdd(false); setShowImport(false)

    const dupMsg = dupeCount > 0 ? `, ${dupeCount} ya existían` : ''
    showToast(`${fresh.length} series agregadas${dupMsg} — buscando posters…`, 5000)

    // Enriquecer con TVMaze en batches de 3 para no saturar la API
    const BATCH = 3
    let matched = 0
    for (let i = 0; i < created.length; i += BATCH) {
      const batch = created.slice(i, i + BATCH)
      const results = await Promise.all(batch.map(s => fetchShowData(s.title)))
      const enriched = batch.map((s, j) => ({ s, data: results[j] })).filter(x => x.data !== null)
      matched += enriched.length
      if (enriched.length > 0) {
        setSeries(prev => {
          const next = prev.map(s => {
            const e = enriched.find(x => x.s.id === s.id)
            if (!e?.data) return s
            return {
              ...s,
              tvmazeId: e.data!.tvmazeId,
              posterPath: e.data!.posterPath ?? s.posterPath,
              overview: e.data!.overview || s.overview,
              genres: e.data!.genres?.length ? e.data!.genres : s.genres,
              nextAirDate: e.data!.nextAirDate,
              nextSeasonNumber: e.data!.nextSeasonNumber,
              titleEs: e.data!.titleEs ?? s.titleEs,
              publicRating: e.data!.publicRating ?? s.publicRating,
            }
          })
          saveSeries(next)
          saveSeriesServer(next)
          return next
        })
      }
      if (i + BATCH < created.length) await new Promise(r => setTimeout(r, 300))
    }
    showToast(`${matched} de ${fresh.length} identificadas con poster ✓`)
  }

  // Chat apply callback
  function handleChatApply(updates?: SeriesUpdate[], additions?: SeriesAddition[], deletions?: string[]) {
    let updated = [...series]

    const now = today()

    updates?.forEach(({ id, fields }) => {
      updated = updated.map(s => {
        if (s.id !== id) return s
        const watchActivity =
          (fields.status === 'viendo' || fields.status === 'completa') ||
          (fields.currentEpisode != null && fields.currentEpisode !== s.currentEpisode) ||
          (fields.currentSeason != null && fields.currentSeason !== s.currentSeason)
        return {
          ...s,
          ...fields,
          updatedAt: now,
          lastWatched: watchActivity ? (fields.lastWatched ?? now) : (fields.lastWatched ?? s.lastWatched),
        }
      })
    })

    additions?.forEach(a => {
      const ns: Series = {
        id: newId(),
        title: a.title,
        currentSeason: a.currentSeason ?? null,
        currentEpisode: a.currentEpisode ?? null,
        status: a.status ?? 'pendiente',
        platform: a.platform ?? null,
        watchedWithPau: a.watchedWithPau ?? false,
        notes: a.notes ?? '',
        lastWatched: null,
        updatedAt: now,
      }
      updated = [ns, ...updated]
    })

    if (deletions?.length) {
      const del = new Set(deletions)
      updated = updated.filter(s => !del.has(s.id))
    }

    persist(updated)
  }

  function handleConfigApply(update: ConfigUpdate) {
    const next: AppConfig = { ...config, ...update }
    setConfig(next)
    saveConfig(next)
    if (update.defaultSort) setSortOrder(update.defaultSort)
    showToast(`Configuración actualizada`)
  }

  function handleOnboarding(limit: number) {
    handleConfigApply({ watchingLimit: limit })
  }

  // Drag-to-reorder sections
  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(idx: number) { if (idx !== dragIdx) setDropIdx(idx) }
  function handleDragEnd() { setDragIdx(null); setDropIdx(null) }
  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { handleDragEnd(); return }
    const next = [...sectionOrder]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    setSectionOrder(next)
    const newConfig = { ...config, sectionOrder: next }
    setConfig(newConfig); saveConfig(newConfig)
    handleDragEnd()
  }

  function getSectionItems(key: SectionKey): Series[] { return sectionItems[key] }

  // Filter and section split
  const filtered = useMemo(() => {
    if (!search) return series
    const q = search.toLowerCase()
    return series.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.platform ?? '').toLowerCase().includes(q) ||
      s.notes.toLowerCase().includes(q) ||
      (s.overview ?? '').toLowerCase().includes(q)
    )
  }, [series, search])

  const sectionItems = useMemo((): Record<SectionKey, Series[]> => {
    return {
      viendo:            sortItems(filtered.filter(s => s.status === 'viendo'), sortOrder),
      pendiente:         sortItems(filtered.filter(s => s.status === 'pendiente'), sortOrder),
      'nueva-temporada': sortItems(filtered.filter(s => s.nextAirDate && s.status === 'completa'), sortOrder),
      completa:          sortItems(filtered.filter(s => s.status === 'completa'), sortOrder),
      pausada:           sortItems(filtered.filter(s => s.status === 'pausada'), sortOrder),
      abandonada:        sortItems(filtered.filter(s => s.status === 'abandonada'), sortOrder),
    }
  }, [filtered, sortOrder])

  const counts = useMemo(() => ({
    viendo: series.filter(s => s.status === 'viendo').length,
    total: series.length,
    newSeason: series.filter(s => s.nextAirDate).length,
  }), [series])

  const activePlatforms = useMemo(() => {
    const seen = new Set<string>()
    series.forEach(s => { if (s.platform) seen.add(s.platform) })
    return [...seen].sort()
  }, [series])

  const commonSectionProps = { allSeries: series, expandedId, onToggle: handleToggle, onUpdate: upsert, onEditFull: setEditSeries, onDelete: deleteSeries }

  return (
    <div style={{ position: 'relative', zIndex: 0 }}>
      <ShaderWallpaper variant="corriente" restMotion={0.07} brightness={0.3} />
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 relative"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 1, background: 'linear-gradient(90deg, rgba(168,85,247,0.5) 0%, rgba(6,182,212,0.25) 55%, rgba(255,255,255,0.03) 100%)' }} />
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-3">
          {/* Top bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs><linearGradient id="lmg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
                <rect width="24" height="24" rx="5.5" fill="#07071a"/>
                <polygon points="8.5,6.5 8.5,17.5 18,12" fill="url(#lmg)"/>
              </svg>
              <h1 className="font-bold text-xl tracking-tight whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Episovic TV</h1>
              {activePlatforms.length > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  {activePlatforms.filter(p => PLATFORM_LOGO[p]).map(p => (
                    <PlatformLogo key={p} name={p} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {config.watchingLimit ? (
                <span
                  className="font-semibold"
                  style={{
                    color: counts.viendo > config.watchingLimit ? '#f87171'
                      : counts.viendo === config.watchingLimit ? '#fbbf24'
                      : '#60a5fa'
                  }}
                >
                  {counts.viendo}/{config.watchingLimit} viendo
                </span>
              ) : (
                <span className="text-blue-400 font-semibold">{counts.viendo} viendo</span>
              )}
              {counts.newSeason > 0 && <span className="text-amber-400">🔔 {counts.newSeason}</span>}
              <span className="text-zinc-700">· {counts.total} total</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Add button */}
              <button
                onClick={() => setShowAdd(v => !v)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={showAdd
                  ? { background: '#fff', color: '#000' }
                  : { background: 'rgba(255,255,255,0.08)', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                + Agregar
              </button>
              {/* Sync */}
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className={syncing ? 'inline-block animate-spin' : ''}>↻</span>
                <span className="hidden sm:inline ml-1">{syncing ? syncMsg || '...' : 'Actualizar todo'}</span>
              </button>
              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >⚙</button>
            </div>
          </div>

          {/* Add input */}
          {showAdd && (
            <div className="fade-in space-y-2">
              {/* Mode toggle */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowImport(false)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
                  style={!showImport ? { background: '#fff', color: '#000' } : { color: '#52525b' }}
                >
                  Una serie
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
                  style={showImport ? { background: '#fff', color: '#000' } : { color: '#52525b' }}
                >
                  📋 Importar lista
                </button>
              </div>

              {!showImport ? (
                <form onSubmit={handleAdd} className="flex gap-2">
                  <input
                    autoFocus
                    value={addInput}
                    onChange={e => setAddInput(toTitleCase(e.target.value))}
                    placeholder="Añade una serie · Ej: Severance en Apple TV"
                    className="flex-1 text-sm text-white placeholder:text-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
                  />
                  <button type="submit" className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: '#fff', color: '#000' }}>
                    OK
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    placeholder={'Una serie por línea:\nBreaking Bad\nThe Wire\nSuccession'}
                    rows={5}
                    className="w-full text-sm text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 focus:outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
                  />
                  {(() => {
                    const lines = importText.split('\n').map(l => l.trim()).filter(l => l.length > 1)
                    const newCount = lines.filter(t => !series.some(s => s.title.toLowerCase() === t.toLowerCase())).length
                    return lines.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-600 flex-1">
                          {newCount} nuevas · {lines.length - newCount} ya en lista
                        </span>
                        <button
                          onClick={handleBulkImport}
                          disabled={newCount === 0}
                          className="text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-30 transition-opacity"
                          style={{ background: '#fff', color: '#000' }}
                        >
                          Importar {newCount > 0 ? newCount : ''}
                        </button>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Search + Sort */}
          <div className="flex gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 text-sm text-white placeholder:text-zinc-700 rounded-xl px-3 py-2 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="text-xs rounded-xl px-3 py-2 text-zinc-400 focus:outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        {filtered.length === 0 ? (
          <p className="text-zinc-700 text-sm text-center py-16">No hay resultados</p>
        ) : (
          <>
            {sectionOrder.map((key, idx) => {
              const items = getSectionItems(key)
              const meta = SECTION_META[key]
              const isDragging = dragIdx === idx
              const isDropTarget = dropIdx === idx && dragIdx !== idx
              return (
                <Section
                  key={key}
                  title={meta.title}
                  accent={meta.accent}
                  btnColor={meta.btnColor}
                  items={items}
                  {...commonSectionProps}
                  collapsed={collapsedSections.has(key) && !search}
                  onCollapseToggle={() => toggleSectionCollapse(key)}
                  sort={sortOrder}
                  onSortChange={s => setSortOrder(s)}
                  onDragStart={(e: React.DragEvent) => { e.dataTransfer.effectAllowed = 'move'; handleDragStart(idx) }}
                  onDragOver={(e: React.DragEvent) => { e.preventDefault(); handleDragOver(idx) }}
                  onDrop={(e: React.DragEvent) => { e.preventDefault(); handleDrop(idx) }}
                  onDragEnd={handleDragEnd}
                  isDragging={isDragging}
                  isDropTarget={isDropTarget}
                />
              )
            })}
          </>
        )}
      </main>

      {/* ── Footer disclaimer ── */}
      <footer
        className="max-w-5xl mx-auto px-4 text-center"
        style={{ paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))' }}
      >
        <p className="text-[11px] tracking-wide text-zinc-600">
          Tracker personal · Datos públicos vía{' '}
          <span style={{ color: '#a855f7' }}>TVMaze</span>
          {' '}· Solo uso propio
        </p>
      </footer>

      {/* ── Modals ── */}
      {editSeries && (
        <SeriesModal
          series={editSeries}
          onClose={() => setEditSeries(null)}
          onSave={s => { upsert(s); setEditSeries(s) }}
          onDelete={id => { persist(series.filter(s => s.id !== id)); setEditSeries(null) }}
        />
      )}
      {showSettings && (
        <SettingsModal
          anthropicKey={anthropicKey}
          onSave={a => { setAnthropicKey(a); saveAnthropicKey(a) }}
          onClose={() => setShowSettings(false)}
          onResetData={() => { persist(initialData); showToast('Datos restaurados') }}
        />
      )}

      {/* ── Onboarding ── */}
      {config.watchingLimit === null && (
        <OnboardingModal onConfirm={handleOnboarding} />
      )}

      {/* ── Claude Chat ── */}
      <ChatPanel
        series={series}
        anthropicKey={anthropicKey}
        config={config}
        onApply={handleChatApply}
        onConfigApply={handleConfigApply}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 text-sm font-medium px-5 py-2.5 rounded-full shadow-2xl pointer-events-none fade-in"
          style={{ background: 'rgba(255,255,255,0.95)', color: '#000' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
