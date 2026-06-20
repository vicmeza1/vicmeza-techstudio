import { useRef } from 'react'
import type { Series } from '../types'
import { SeriesCard } from './SeriesCard'

interface Props {
  title: string
  series: Series[]
  onCardClick: (s: Series) => void
  accent?: string
}

export function CategoryRow({ title, series, onCardClick, accent = 'text-white' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (series.length === 0) return null

  function scroll(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' })
  }

  return (
    <section className="mb-10">
      {/* Row header */}
      <div className="flex items-baseline gap-3 mb-4 px-4 md:px-8">
        <h2 className={`font-bold text-2xl tracking-tight ${accent}`}>{title}</h2>
        <span className="text-zinc-600 text-sm tabular-nums">{series.length}</span>
      </div>

      {/* Scroll area */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 z-20 w-14 flex items-center justify-start pl-2
            opacity-0 group-hover/row:opacity-100 transition-opacity duration-200
            focus:outline-none"
          style={{ background: 'linear-gradient(to right, rgba(8,8,8,0.95) 0%, transparent 100%)' }}
        >
          <span className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white text-xl font-light transition-colors">
            ‹
          </span>
        </button>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-3"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {series.map(s => (
            <SeriesCard key={s.id} series={s} onClick={onCardClick} />
          ))}
          {/* Trailing spacer so last card isn't flush against edge */}
          <div className="flex-shrink-0 w-4" />
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 z-20 w-14 flex items-center justify-end pr-2
            opacity-0 group-hover/row:opacity-100 transition-opacity duration-200
            focus:outline-none"
          style={{ background: 'linear-gradient(to left, rgba(8,8,8,0.95) 0%, transparent 100%)' }}
        >
          <span className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white text-xl font-light transition-colors">
            ›
          </span>
        </button>
      </div>
    </section>
  )
}
