import { useState, useEffect, useRef } from 'react'
import type { Series } from '../types'
import { parseCommand, describeAction } from '../nlp'
import { fetchShowData, fetchShowById } from '../tvmaze'

const STAR_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#a3e635', '#22c55e']

const PLATFORM_BRAND: Record<string, { bg: string; fg: string; text: string; sub?: string }> = {
  'Netflix':    { bg: '#141414', fg: '#E50914', text: 'NETFLIX' },
  'Apple TV':   { bg: '#000000', fg: '#f5f5f7', text: 'Apple', sub: 'TV+' },
  'HBO':        { bg: '#1a1a1a', fg: '#c0c0c0', text: 'HBO' },
  'Prime':      { bg: '#0F1111', fg: '#00A8E0', text: 'prime', sub: 'video' },
  'Paramount+': { bg: '#003dcc', fg: '#ffffff', text: 'P+', sub: 'Paramount' },
  'Disney+':    { bg: '#0B0E31', fg: '#ffffff', text: 'DISNEY+' },
  'Star+':      { bg: '#1a0030', fg: '#a855f7', text: 'Star+' },
  'Hulu':       { bg: '#0d0d0d', fg: '#1CE783', text: 'hulu' },
  'Peacock':    { bg: '#0d0d0d', fg: '#ffffff', text: 'PEACOCK' },
  'FX':         { bg: '#111111', fg: '#ffffff', text: 'FX' },
  'Mubi':       { bg: '#0d0d0d', fg: '#00C9B1', text: 'MUBI' },
  'VIX':        { bg: '#1a0000', fg: '#FF3300', text: 'VIX' },
  'Thunder':    { bg: '#0a0a1a', fg: '#c084fc', text: 'THUNDER' },
}

function pubRatingColor(r: number) {
  if (r >= 8) return '#22c55e'
  if (r >= 7) return '#a3e635'
  if (r >= 6) return '#fbbf24'
  if (r >= 5) return '#f97316'
  return '#ef4444'
}

const STATUS_CFG = {
  viendo:     { icon: '▶', label: 'Viendo',     color: '#60a5fa' },
  completa:   { icon: '✓', label: 'Vista',      color: '#4ade80' },
  pendiente:  { icon: '+', label: 'Pendiente',  color: '#fbbf24' },
  pausada:    { icon: '⏸', label: 'En pausa',   color: '#71717a' },
  abandonada: { icon: '✕', label: 'Abandonada', color: '#f87171' },
}

const PLAT_ABBR: Record<string, string> = {
  'Netflix': 'Netflix', 'Apple TV': 'Apple TV', 'HBO': 'HBO',
  'Prime': 'Prime', 'Paramount+': 'Param+', 'Disney+': 'Disney+',
  'Star+': 'Star+', 'Hulu': 'Hulu', 'Peacock': 'Peacock',
  'FX': 'FX', 'Mubi': 'Mubi', 'VIX': 'VIX', 'Thunder': 'Thunder',
}

function relDate(d: string | null): string {
  if (!d) return ''
  try {
    const date = new Date(d + 'T12:00:00')
    const sameYear = new Date().getFullYear() === date.getFullYear()
    return date.toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short',
      ...(!sameYear ? { year: '2-digit' } : {}),
    })
  } catch { return d }
}

interface Props {
  series: Series
  allSeries: Series[]
  expanded: boolean
  onToggle: () => void
  onUpdate: (updated: Series) => void
  onEditFull: () => void
  onDelete: (id: string) => void
}

export function SeriesRow({ series, allSeries, expanded, onToggle, onUpdate, onEditFull, onDelete }: Props) {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<ReturnType<typeof parseCommand> | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [lightbox, setLightbox] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput, setDateInput] = useState(series.lastWatched ?? '')
  const [linkInput, setLinkInput] = useState('')
  const [linking, setLinking] = useState(false)
  const [autoSearching, setAutoSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLInputElement>(null)

  const logEntries = series.notes ? series.notes.split('\n').filter(Boolean) : []

  const st = STATUS_CFG[series.status]

  useEffect(() => {
    setDateInput(series.lastWatched ?? '')
  }, [series.lastWatched])

  // Auto-fetch TVMaze info when expanded and no overview yet
  useEffect(() => {
    if (expanded && !series.overview && !series.tvmazeId && !loadingInfo) {
      setLoadingInfo(true)
      fetchShowData(series.title).then(data => {
        if (data) onUpdate({
          ...series,
          tvmazeId: data.tvmazeId,
          posterPath: data.posterPath ?? series.posterPath,
          overview: data.overview || series.overview,
          genres: data.genres.length ? data.genres : series.genres,
          nextAirDate: data.nextAirDate,
          nextSeasonNumber: data.nextSeasonNumber,
          titleEs: data.titleEs ?? series.titleEs,
        })
        setLoadingInfo(false)
      })
    }
    if (expanded) setTimeout(() => inputRef.current?.focus(), 80)
  }, [expanded]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(val: string) {
    setInput(val)
    if (val.trim().length < 2) { setPreview(null); setPendingAction(null); return }
    // Prepend the series title for context so NLP can match it
    const contextual = `${val} de ${series.title}`
    const direct = parseCommand(val, allSeries)
    const action = direct.type !== 'unknown' ? direct : parseCommand(contextual, allSeries)
    if (action.type !== 'unknown') {
      setPreview(describeAction(action))
      setPendingAction(action)
    } else {
      setPreview(null)
      setPendingAction(null)
    }
  }

  async function handleAutoSearch() {
    setAutoSearching(true)
    const data = await fetchShowData(series.title)
    setAutoSearching(false)
    if (!data) return
    onUpdate({
      ...series,
      tvmazeId: data.tvmazeId,
      posterPath: data.posterPath ?? series.posterPath,
      overview: data.overview || series.overview,
      genres: data.genres.length ? data.genres : (series.genres ?? []),
      nextAirDate: data.nextAirDate,
      nextSeasonNumber: data.nextSeasonNumber,
      titleEs: data.titleEs ?? series.titleEs,
      publicRating: data.publicRating ?? series.publicRating,
    })
  }

  async function handleLink(e: React.FormEvent) {
    e.preventDefault()
    const match = linkInput.match(/tvmaze\.com\/shows\/(\d+)/i)
    if (!match) return
    setLinking(true)
    const data = await fetchShowById(Number(match[1]))
    setLinking(false)
    if (!data) return
    onUpdate({
      ...series,
      tvmazeId: data.tvmazeId,
      posterPath: data.posterPath ?? series.posterPath,
      overview: data.overview || series.overview,
      genres: data.genres.length ? data.genres : (series.genres ?? []),
      nextAirDate: data.nextAirDate,
      nextSeasonNumber: data.nextSeasonNumber,
      titleEs: data.titleEs ?? series.titleEs,
      publicRating: data.publicRating ?? series.publicRating,
    })
    setLinkInput('')
  }

  function todayStr() { return new Date().toISOString().slice(0, 10) }

  function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = noteInput.trim()
    if (!text) return
    const entry = `${todayStr()} · ${text}`
    const newNotes = series.notes ? `${entry}\n${series.notes}` : entry
    onUpdate({ ...series, notes: newNotes })
    setNoteInput('')
    noteRef.current?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingAction) return
    const today = todayStr()
    let updated = { ...series }
    if (pendingAction.type === 'update_status') {
      updated.status = pendingAction.status
      if (pendingAction.status === 'viendo' || pendingAction.status === 'completa') {
        updated.lastWatched = today
      }
    } else if (pendingAction.type === 'update_progress') {
      updated.status = 'viendo'
      updated.lastWatched = today
      if (pendingAction.season != null) updated.currentSeason = pendingAction.season
      if (pendingAction.episode != null) updated.currentEpisode = pendingAction.episode
      if (pendingAction.platform) updated.platform = pendingAction.platform
    }
    onUpdate(updated)
    setInput(''); setPreview(null); setPendingAction(null)
    onToggle()
  }

  return (
    <div
      className={`rounded-xl transition-colors duration-150 ${expanded ? 'bg-white/[0.04]' : ''}`}
      style={expanded ? { boxShadow: 'inset 2px 0 0 rgba(168,85,247,0.28)' } : undefined}
    >
      {/* ── Main row ── */}
      <button
        onClick={onToggle}
        className="group w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03] rounded-xl transition-colors"
      >
        {/* Poster */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800"
          style={{ width: 96, height: 144, minWidth: 96 }}
          onClick={series.posterPath ? (e) => { e.stopPropagation(); setLightbox(true) } : undefined}
        >
          {series.posterPath ? (
            <img src={series.posterPath} alt="" className="w-full h-full object-cover" loading="lazy" draggable={false} style={{ cursor: 'zoom-in' }} />
          ) : (() => {
            const brand = series.platform ? PLATFORM_BRAND[series.platform] : null
            return brand ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-0.5" style={{ background: brand.bg }}>
                <span className="font-black tracking-widest leading-none" style={{ color: brand.fg, fontSize: 13 }}>{brand.text}</span>
                {brand.sub && <span className="font-medium tracking-wider leading-none" style={{ color: brand.fg, fontSize: 9, opacity: 0.7 }}>{brand.sub}</span>}
              </div>
            ) : (
              <div className="w-full h-full" style={{ background: 'linear-gradient(160deg,#1a1a3e,#0d0d1a)' }} />
            )
          })()}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="text-[22px] font-semibold text-zinc-100 truncate leading-snug">
            {series.title}
            {series.watchedWithPau && <span className="ml-2 text-pink-500/60 text-sm">♥</span>}
          </div>
          {series.titleEs && series.titleEs.toLowerCase() !== series.title.toLowerCase() && (
            <div className="text-sm text-zinc-600 truncate leading-tight mt-1">{series.titleEs}</div>
          )}
        </div>

        {/* Stars column — mi nota + pública */}
        <div className="hidden sm:flex flex-col justify-center flex-shrink-0 w-20 gap-0.5">
          <div className="flex gap-px">
            {[1,2,3,4,5].map(n => (
              <span key={n} style={{ fontSize: 14, color: n <= (series.rating ?? 0) ? STAR_COLORS[n-1] : 'rgba(255,255,255,0.07)' }}>★</span>
            ))}
          </div>
          {series.publicRating != null ? (
            <div className="flex items-baseline gap-1">
              <span className="tabular-nums font-semibold" style={{ fontSize: 9, color: pubRatingColor(series.publicRating) }}>
                {series.publicRating.toFixed(1)}
              </span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>TVMaze</span>
            </div>
          ) : null}
        </div>

        {/* Platform */}
        <span className="hidden md:block text-base text-zinc-500 flex-shrink-0 w-24 text-right">
          {series.platform ? (PLAT_ABBR[series.platform] ?? series.platform) : ''}
        </span>

        {/* Status — icon only on mobile, full label on sm+ */}
        <span className="text-base font-medium flex-shrink-0 w-6 sm:w-28 text-right" style={{ color: st.color }}>
          <span className="sm:hidden">{st.icon}</span>
          <span className="hidden sm:inline">{st.icon} {st.label}</span>
        </span>

        {/* Season · Episode — hidden on mobile */}
        <span className="hidden sm:block text-base text-zinc-600 flex-shrink-0 w-20 text-right tabular-nums">
          {series.currentSeason != null ? `T${series.currentSeason}` : ''}
          {series.currentEpisode != null ? `·E${series.currentEpisode}` : ''}
        </span>

        {/* Date — click to edit */}
        <div
          className="flex-shrink-0 w-20 sm:w-24 text-right"
          onClick={e => { e.stopPropagation(); setEditingDate(true) }}
        >
          {editingDate ? (
            <input
              type="date"
              autoFocus
              value={series.lastWatched ?? new Date().toISOString().slice(0, 10)}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => {
                onUpdate({ ...series, lastWatched: e.target.value || null })
                setEditingDate(false)
              }}
              onBlur={() => setEditingDate(false)}
              className="text-base text-zinc-300 bg-transparent focus:outline-none w-full text-right"
              style={{ colorScheme: 'dark' }}
            />
          ) : (
            <span className={`text-base tabular-nums cursor-pointer transition-colors ${series.lastWatched ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-700 hover:text-zinc-500'}`}>
              {series.lastWatched ? relDate(series.lastWatched) : '—'}
            </span>
          )}
        </div>

        {/* New season bell */}
        {series.nextAirDate
          ? <span className="text-base text-amber-400 flex-shrink-0">🔔</span>
          : <span className="w-5 flex-shrink-0" />
        }

        {/* Edit ··· */}
        <button
          onClick={e => { e.stopPropagation(); onEditFull() }}
          className="opacity-30 sm:opacity-0 sm:group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 text-xl leading-none flex-shrink-0 px-1 transition-all"
          tabIndex={-1}
        >
          ···
        </button>
      </button>

      {/* ── Poster lightbox ── */}
      {lightbox && series.posterPath && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
          onClick={() => setLightbox(false)}
        >
          <img
            src={series.posterPath.replace('medium_portrait', 'original_untouched').replace('thumb', 'original_untouched')}
            onError={e => { (e.target as HTMLImageElement).src = series.posterPath! }}
            alt={series.title}
            className="rounded-xl shadow-2xl"
            style={{ maxHeight: '82vh', maxWidth: '90vw', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
            draggable={false}
          />
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl leading-none"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="px-3 pb-4" style={{ paddingLeft: 120 }}>
          {/* Description (overview only) */}
          {loadingInfo && (
            <p className="text-zinc-600 text-xs mb-2 italic">Cargando descripción...</p>
          )}
          {series.overview && !loadingInfo && (
            <p className="text-zinc-300 text-sm leading-relaxed mb-3 line-clamp-3">
              {series.overview}
            </p>
          )}
          {series.nextAirDate && series.nextSeasonNumber && (
            <p className="text-amber-400/80 text-[11px] mb-2">
              🔔 Temporada {series.nextSeasonNumber} —{' '}
              {new Date(series.nextAirDate + 'T12:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </p>
          )}
          {/* ── Calificación con estrellas ── */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest text-zinc-700 flex-shrink-0">Mi nota</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => onUpdate({ ...series, rating: series.rating === n ? undefined : n })}
                    className="text-[22px] leading-none transition-transform hover:scale-125 active:scale-110"
                    style={{
                      color: (series.rating ?? 0) >= n ? STAR_COLORS[n-1] : 'rgba(255,255,255,0.1)',
                      filter: (series.rating ?? 0) >= n ? `drop-shadow(0 0 5px ${STAR_COLORS[n-1]}88)` : 'none',
                    }}
                  >★</button>
                ))}
              </div>
              {series.rating != null && (
                <span className="text-[10px] text-zinc-500 italic">
                  {['','meh','entretenida','buena','muy buena','¡imperdible!'][series.rating]}
                </span>
              )}
            </div>
            {series.publicRating != null && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] uppercase tracking-widest text-zinc-700">Público</span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: pubRatingColor(series.publicRating) }}
                >
                  {series.publicRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-zinc-700">/10 · TVMaze</span>
              </div>
            )}
          </div>

          {/* ── Buscar datos en internet (TVMaze) ── */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleAutoSearch}
              disabled={autoSearching || loadingInfo}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.14), rgba(6,182,212,0.1))', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              {autoSearching ? '⟳ Buscando...' : '🌐 Buscar en internet'}
            </button>
            <form onSubmit={handleLink} className="flex-1 flex items-center gap-1.5 min-w-0">
              <input
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                placeholder="o pega link tvmaze.com/shows/..."
                className="flex-1 min-w-0 text-[11px] text-zinc-400 placeholder:text-zinc-800 bg-transparent border-b border-zinc-800 focus:border-zinc-500 focus:text-zinc-200 focus:outline-none transition-colors pb-px"
              />
              {linkInput.trim() && (
                <button type="submit" disabled={linking}
                  className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex-shrink-0 disabled:opacity-40">
                  {linking ? '...' : '↓'}
                </button>
              )}
            </form>
          </div>

          {/* Fecha de visto — editable con guardar explícito */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-700">Vista el</span>
            <input
              type="date"
              value={dateInput}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => setDateInput(e.target.value)}
              className="text-[11px] text-zinc-400 bg-transparent border-b border-zinc-800 focus:border-zinc-500 focus:text-zinc-200 focus:outline-none transition-colors cursor-pointer pb-px"
              style={{ colorScheme: 'dark' }}
            />
            {dateInput !== (series.lastWatched ?? '') && dateInput && (
              <button
                onClick={() => onUpdate({ ...series, lastWatched: dateInput })}
                className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors px-1 leading-none"
              >
                ✓ Guardar
              </button>
            )}
          </div>

          {/* Quick status chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(['viendo', 'completa', 'pendiente', 'pausada', 'abandonada'] as const).map(s => (
              <button
                key={s}
                onClick={() => onUpdate({
                  ...series,
                  status: s,
                  lastWatched: (s === 'viendo' || s === 'completa') && s !== series.status ? todayStr() : series.lastWatched,
                })}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full transition-all"
                style={series.status === s
                  ? { background: '#fff', color: '#000' }
                  : { background: 'rgba(255,255,255,0.07)', color: '#71717a' }
                }
              >
                {STATUS_CFG[s].icon} {STATUS_CFG[s].label}
              </button>
            ))}
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full transition-all"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
            >
              🗑 Eliminar
            </button>
          </div>

          {/* Delete confirmation */}
          {confirmDelete && (
            <div className="mb-3 flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span className="text-[11px] text-rose-400 flex-1">¿Eliminar permanentemente? No se puede deshacer.</span>
              <button
                onClick={() => onDelete(series.id)}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors px-1"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Notes log */}
          <div className="mb-3 rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {logEntries.length > 0 && (
              <div className="mb-1.5 space-y-0.5">
                {logEntries.slice(0, 3).map((entry, i) => (
                  <p key={i} className="text-[10px] text-zinc-600 leading-relaxed">{entry}</p>
                ))}
                {logEntries.length > 3 && (
                  <p className="text-[10px] text-zinc-700">+{logEntries.length - 3} entrada{logEntries.length - 3 > 1 ? 's' : ''} más — ver en ···</p>
                )}
              </div>
            )}
            <form onSubmit={handleNoteSubmit} className="flex items-center gap-1.5">
              <span className="text-zinc-700 text-[11px] flex-shrink-0">✎</span>
              <input
                ref={noteRef}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder={logEntries.length > 0 ? 'Añadir nota...' : 'Añadir primera nota...'}
                className="flex-1 text-[11px] text-zinc-400 placeholder:text-zinc-700 bg-transparent focus:outline-none focus:text-white transition-colors"
              />
              {noteInput.trim() && (
                <button type="submit" className="text-[10px] text-zinc-500 hover:text-white transition-colors flex-shrink-0 font-medium">
                  ✓
                </button>
              )}
            </form>
          </div>

          {/* Inline progress chat */}
          {preview && (
            <p className="text-[11px] text-zinc-400 mb-1.5 px-1">{preview}</p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => handleChange(e.target.value)}
              placeholder="Ej: terminé temp 2 · empecé en Netflix · voy en ep 5"
              className="flex-1 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-white/20 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
            />
            <button
              type="submit"
              disabled={!pendingAction}
              className="text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-25 transition-colors"
              style={{ background: '#fff', color: '#000' }}
            >
              OK
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
