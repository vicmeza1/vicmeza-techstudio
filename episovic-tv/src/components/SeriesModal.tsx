import { useEffect, useState } from 'react'
import type { Series, SeriesStatus } from '../types'
import { StatusBadge } from './StatusBadge'
import { IMG, IMG_BG } from '../tmdb'
import { fetchShowById } from '../tvmaze'

const PLATFORMS = ['Netflix', 'Apple TV', 'HBO', 'Prime', 'Paramount+', 'Disney+', 'Star+', 'Hulu', 'Peacock', 'FX', 'Mubi', 'VIX', 'Thunder', 'Otro']
const STATUSES: { value: SeriesStatus; label: string }[] = [
  { value: 'viendo', label: '▶ Viendo' },
  { value: 'completa', label: '✓ Completa' },
  { value: 'pendiente', label: '+ Pendiente' },
  { value: 'pausada', label: '⏸ Pausada' },
  { value: 'abandonada', label: '✕ Abandonada' },
]

interface Props {
  series: Series
  onClose: () => void
  onSave: (updated: Series) => void
  onDelete: (id: string) => void
}

export function SeriesModal({ series, onClose, onSave, onDelete }: Props) {
  const [linkInput, setLinkInput] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  async function handleLink(e: React.FormEvent) {
    e.preventDefault()
    const match = linkInput.match(/tvmaze\.com\/shows\/(\d+)/i)
    if (!match) { setLinkError('Pega un link de tvmaze.com/shows/...'); return }
    setLinking(true); setLinkError('')
    const data = await fetchShowById(Number(match[1]))
    setLinking(false)
    if (!data) { setLinkError('No se encontró la serie en TVMaze'); return }
    onSave({
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

  function update<K extends keyof Series>(key: K, value: Series[K]) {
    onSave({ ...series, [key]: value })
  }

  const nextSeason = series.nextAirDate
    ? `Temporada ${series.nextSeasonNumber} — ${new Date(series.nextAirDate + 'T00:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`
    : null

  const bg = series.posterPath ? `${IMG_BG}${series.posterPath}` : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Hero */}
        <div className="relative h-52 overflow-hidden rounded-t-2xl">
          {bg ? (
            <img src={bg} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #0d0d1a 60%, #1a0a2e 100%)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #111111 0%, rgba(17,17,17,0.6) 50%, transparent 100%)' }} />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            ✕
          </button>

          {/* Poster thumb + title */}
          <div className="absolute bottom-0 left-0 p-5 flex items-end gap-4">
            {series.posterPath && (
              <img
                src={`${IMG}${series.posterPath}`}
                alt=""
                className="w-16 h-24 rounded-lg object-cover shadow-xl flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              />
            )}
            <div>
              <input
                value={series.title}
                onChange={e => update('title', e.target.value)}
                className="text-white text-xl font-bold leading-tight bg-transparent border-b border-transparent focus:border-white/30 focus:outline-none w-full"
                style={{ minWidth: 0 }}
              />
              {series.titleEs && series.titleEs.toLowerCase() !== series.title.toLowerCase() && (
                <p className="text-zinc-500 text-xs mt-0.5">{series.titleEs}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={series.status} />
                {series.genres && <span className="text-zinc-500 text-xs">{series.genres.slice(0, 2).join(' · ')}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* New season alert */}
          {nextSeason && (
            <div className="rounded-xl px-4 py-3 text-amber-300 text-sm flex items-center gap-2"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
              🔔 Nueva temporada: <span className="font-medium">{nextSeason}</span>
            </div>
          )}

          {/* Overview */}
          {series.overview && (
            <p className="text-zinc-400 text-sm leading-relaxed">{series.overview}</p>
          )}

          {/* Status */}
          <div>
            <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">Estado</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => update('status', s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    series.status === s.value
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  style={series.status !== s.value ? { background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' } : {}}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">Temporada</label>
              <input
                type="number" min={1}
                value={series.currentSeason ?? ''}
                onChange={e => update('currentSeason', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="—"
                className="w-full rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/30"
                style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">Episodio</label>
              <input
                type="number" min={1}
                value={series.currentEpisode ?? ''}
                onChange={e => update('currentEpisode', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="—"
                className="w-full rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/30"
                style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">Plataforma</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => update('platform', series.platform === p ? null : p)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    series.platform === p ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                  style={series.platform !== p ? { background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' } : {}}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-zinc-500 text-xs uppercase tracking-widest">Registro de notas</label>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10)
                  const prefix = `${today} · `
                  const newNotes = series.notes ? `${prefix}\n${series.notes}` : prefix
                  update('notes', newNotes)
                }}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                + entrada de hoy
              </button>
            </div>
            <textarea
              value={series.notes}
              onChange={e => update('notes', e.target.value)}
              rows={4}
              placeholder={'2026-06-18 · Vi hasta ep 6, muy buena\n2026-06-15 · Empecé a ver'}
              className="w-full rounded-xl px-3 py-2.5 text-zinc-300 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'inherit' }}
            />
          </div>

          {/* Vista con Pau */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => update('watchedWithPau', !series.watchedWithPau)}
              className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${series.watchedWithPau ? 'bg-pink-500' : ''}`}
              style={!series.watchedWithPau ? { background: '#2a2a2a' } : {}}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${series.watchedWithPau ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-zinc-300 text-sm">Vista con Pau ♥</span>
          </label>

          {/* TVMaze link */}
          <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">
              {series.tvmazeId ? 'Cambiar fuente TVMaze' : '🔗 Pegar link de TVMaze para cargar datos'}
            </label>
            <form onSubmit={handleLink} className="flex gap-2">
              <input
                value={linkInput}
                onChange={e => { setLinkInput(e.target.value); setLinkError('') }}
                placeholder="https://www.tvmaze.com/shows/123/..."
                className="flex-1 text-xs text-zinc-300 placeholder:text-zinc-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-white/20"
                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                type="submit"
                disabled={!linkInput.trim() || linking}
                className="text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-30 transition-opacity flex-shrink-0"
                style={{ background: '#fff', color: '#000' }}
              >
                {linking ? '...' : 'Cargar'}
              </button>
            </form>
            {linkError && <p className="text-rose-400 text-xs mt-1">{linkError}</p>}
          </div>

          {/* Delete */}
          <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              onClick={() => { onDelete(series.id); onClose() }}
              className="text-red-500/60 hover:text-red-400 text-xs transition-colors"
            >
              Eliminar esta serie
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
