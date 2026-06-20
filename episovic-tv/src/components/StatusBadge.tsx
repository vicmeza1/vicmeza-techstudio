import type { SeriesStatus } from '../types'

const CONFIG: Record<SeriesStatus, { label: string; className: string }> = {
  viendo:    { label: 'Viendo',    className: 'bg-blue-500/25 text-blue-300 border border-blue-400/40' },
  completa:  { label: 'Completa',  className: 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40' },
  pendiente: { label: 'Pendiente', className: 'bg-amber-500/25 text-amber-300 border border-amber-400/40' },
  pausada:    { label: 'Pausada',    className: 'bg-zinc-600/30 text-zinc-400 border border-zinc-500/30' },
  abandonada: { label: 'Abandonada', className: 'bg-rose-500/15 text-rose-400/70 border border-rose-500/25' },
}

export function StatusBadge({ status }: { status: SeriesStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
