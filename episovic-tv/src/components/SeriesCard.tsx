import type { Series } from '../types'
import { StatusBadge } from './StatusBadge'
import { PlatformBadge } from './PlatformBadge'
import { IMG } from '../tmdb'

interface Props {
  series: Series
  onClick: (s: Series) => void
}

export function SeriesCard({ series, onClick }: Props) {
  const hasPoster = Boolean(series.posterPath)
  const desc = series.overview || series.notes

  return (
    <button
      onClick={() => onClick(series)}
      className="group relative flex-shrink-0 w-[156px] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 hover:scale-[1.04] hover:z-10"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Card frame */}
      <div
        className="aspect-[2/3] relative overflow-hidden rounded-xl shadow-lg"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}
      >
        {/* Poster image or placeholder */}
        {hasPoster ? (
          <img
            src={`${IMG}${series.posterPath}`}
            alt={series.title}
            loading="lazy"
            draggable={false}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3"
            style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #0d0d1a 60%, #1a0a2a 100%)' }}
          >
            <span className="text-zinc-300 text-[11px] font-semibold text-center leading-snug line-clamp-4">
              {series.title}
            </span>
          </div>
        )}

        {/* Default bottom gradient: title visible at rest */}
        <div className="absolute inset-0 transition-opacity duration-250 group-hover:opacity-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 45%, transparent 100%)' }}
        >
          {hasPoster && (
            <div className="absolute bottom-0 inset-x-0 px-2.5 pb-2.5">
              <p className="text-white text-[10px] font-semibold leading-tight line-clamp-2">
                {series.title}
              </p>
              {series.platform && (
                <PlatformBadge platform={series.platform} />
              )}
            </div>
          )}
        </div>

        {/* Hover overlay: full info */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col justify-between p-3"
          style={{ background: 'rgba(0,0,0,0.88)' }}
        >
          {/* Top */}
          <div className="flex flex-col gap-1.5">
            <StatusBadge status={series.status} />
            {series.platform && <PlatformBadge platform={series.platform} />}
          </div>

          {/* Bottom */}
          <div className="flex flex-col gap-1.5">
            <p className="text-white text-[11px] font-bold leading-snug line-clamp-2">
              {series.title}
            </p>
            {desc && (
              <p className="text-zinc-400 text-[9.5px] leading-relaxed line-clamp-5">
                {desc}
              </p>
            )}
            {(series.currentSeason != null || series.currentEpisode != null) && (
              <p className="text-zinc-600 text-[9px] font-medium">
                {series.currentSeason != null && `T${series.currentSeason}`}
                {series.currentEpisode != null && ` · E${series.currentEpisode}`}
              </p>
            )}
          </div>
        </div>

        {/* Subtle border glow on hover */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-transparent group-hover:ring-white/20 transition-all duration-300 pointer-events-none" />

        {/* New season badge */}
        {series.nextAirDate && (
          <div className="absolute top-2 right-2 bg-amber-400 text-black text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider pointer-events-none">
            T{series.nextSeasonNumber} pronto
          </div>
        )}

        {/* Watched with Pau badge */}
        {series.watchedWithPau && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-pink-500/80 flex items-center justify-center text-[8px]">♥</div>
          </div>
        )}
      </div>
    </button>
  )
}
