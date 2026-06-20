import { useState, useEffect } from 'react'

interface Props {
  anthropicKey: string
  onSave: (anthropic: string) => void
  onClose: () => void
  onResetData: () => void
}

export function SettingsModal({ anthropicKey, onSave, onClose, onResetData }: Props) {
  const [claude, setClaude] = useState(anthropicKey)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Configuración</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">✕</button>
        </div>

        {/* TVMaze notice */}
        <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-zinc-300 text-sm font-medium">📺 Posters y descripciones: TVMaze</p>
          <p className="text-zinc-600 text-xs leading-relaxed">
            La app usa <strong className="text-zinc-500">TVMaze.com</strong> para cargar posters, descripciones y alertas de nuevas temporadas.
            Es gratis y no requiere API key. Se activa automáticamente al expandir una serie o al presionar "Actualizar todo".
          </p>
        </div>

        {/* Claude API (optional) */}
        <div className="space-y-2">
          <label className="text-zinc-400 text-sm font-medium block">Claude API Key <span className="text-zinc-600 font-normal">(opcional)</span></label>
          <p className="text-zinc-600 text-xs leading-relaxed">
            Para series que TVMaze no encuentre, Claude genera la descripción automáticamente.
            Consíguela en{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">console.anthropic.com</a>
          </p>
          <input
            type="password"
            value={claude}
            onChange={e => setClaude(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
            style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <button
          onClick={() => { onSave(claude); onClose() }}
          className="w-full bg-white text-black font-bold py-2.5 rounded-xl text-sm hover:bg-zinc-200 transition-colors"
        >
          Guardar
        </button>

        {/* Danger */}
        <div className="pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-zinc-700 text-xs">Zona de peligro</p>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="text-red-500/50 hover:text-red-400 text-xs transition-colors">
              Restaurar datos originales
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-red-400 text-xs">¿Seguro? Borra todos los cambios guardados.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onResetData(); onClose() }}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                >Sí, restaurar</button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-xs px-3 py-1.5 rounded-lg text-zinc-500"
                  style={{ background: '#1f1f1f' }}
                >Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
