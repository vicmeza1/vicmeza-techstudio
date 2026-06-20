const OPTIONS = [3, 5, 7, 10]

interface Props {
  onConfirm: (limit: number) => void
}

export function OnboardingModal({ onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-7 space-y-5 shadow-2xl"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="space-y-1.5">
          <h2 className="text-white font-bold text-lg">¿Cuántas series a la vez?</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Tener demasiadas activas dificulta terminar cualquiera. Elige un límite que te funcione.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => onConfirm(n)}
              className="py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="text-zinc-700 text-xs text-center">
          Puedes cambiarlo después desde el chat o configuración.
        </p>
      </div>
    </div>
  )
}
