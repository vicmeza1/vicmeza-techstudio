const COLORS: Record<string, string> = {
  'Netflix':    'text-red-400',
  'Apple TV':   'text-zinc-300',
  'HBO':        'text-purple-400',
  'Prime':      'text-cyan-400',
  'Paramount+': 'text-sky-400',
  'Disney+':    'text-blue-400',
  'Star+':      'text-pink-400',
  'Hulu':       'text-green-400',
  'Peacock':    'text-yellow-300',
  'FX':         'text-orange-400',
  'Mubi':       'text-rose-400',
}

export function PlatformBadge({ platform }: { platform: string }) {
  const color = COLORS[platform] ?? 'text-zinc-400'
  return (
    <span className={`text-[9px] font-semibold ${color}`}>{platform}</span>
  )
}
