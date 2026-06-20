import { useState, useRef, useEffect } from 'react'
import type { Series } from '../types'
import type { AppConfig } from '../config'
import { sendChatMessage } from '../claude-chat'
import type { ChatHistoryItem, SeriesUpdate, SeriesAddition, ConfigUpdate } from '../claude-chat'

interface Props {
  series: Series[]
  anthropicKey: string
  config: AppConfig
  onApply: (updates?: SeriesUpdate[], additions?: SeriesAddition[], deletions?: string[]) => void
  onConfigApply: (update: ConfigUpdate) => void
  onOpenSettings: () => void
}

const SUGGESTIONS = [
  'Marca Juego del Calamar como terminada',
  '¿Qué series tienen nueva temporada pronto?',
  'Cambia mi límite de series a 7',
  'Agrega Severance en Apple TV',
]

export function ChatPanel({ series, anthropicKey, config, onApply, onConfigApply, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<ChatHistoryItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const msg = input.trim()
    if (!msg || loading || !anthropicKey) return
    setInput('')

    const newHistory: ChatHistoryItem[] = [...history, { role: 'user', text: msg }]
    setHistory(newHistory)
    setLoading(true)

    try {
      const result = await sendChatMessage(msg, history, series, anthropicKey, config)

      const hasSeriesChanges = result.updates?.length || result.additions?.length || result.deletions?.length
      if (hasSeriesChanges) onApply(result.updates, result.additions, result.deletions)
      if (result.configUpdate) onConfigApply(result.configUpdate)

      const hasChanges = hasSeriesChanges || result.configUpdate
      const responseText = result.text || (hasChanges ? '✓ Listo.' : 'No entendí bien, intenta de nuevo.')
      setHistory(prev => [...prev, { role: 'assistant', text: responseText }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setHistory(prev => [...prev, { role: 'assistant', text: `Error: ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleSuggestion(s: string) {
    setInput(s)
    inputRef.current?.focus()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}
      >
        <span style={{ fontSize: 15 }}>✦</span> Claude
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
      style={{
        width: 380,
        height: 500,
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1a' }}
      >
        <span style={{ color: '#a78bfa', fontSize: 15 }}>✦</span>
        <span className="text-white font-semibold text-sm flex-1">Claude</span>
        <span className="text-zinc-600 text-xs mr-2">{series.length} series</span>
        <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {!anthropicKey ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-zinc-500 text-sm">Necesitas tu Claude API Key para usar el chat.</p>
            <button
              onClick={onOpenSettings}
              className="text-xs px-4 py-2 rounded-full transition-colors"
              style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}
            >
              Abrir configuración ⚙
            </button>
          </div>
        ) : history.length === 0 && !loading ? (
          <div className="py-4 space-y-3">
            <p className="text-zinc-600 text-xs text-center">Dime qué cambiar o pregúntame algo.</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-xl transition-colors hover:bg-white/[0.06]"
                  style={{ background: 'rgba(255,255,255,0.03)', color: '#71717a', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === 'user'
                    ? { background: '#fff', color: '#000' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#d4d4d4' }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="block w-1.5 h-1.5 rounded-full bg-zinc-500"
                        style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      {anthropicKey && (
        <form
          onSubmit={handleSend}
          className="flex gap-2 p-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe un cambio o pregunta..."
            disabled={loading}
            className="flex-1 text-sm text-white placeholder:text-zinc-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="text-sm font-bold px-3 py-2 rounded-xl disabled:opacity-20 transition-colors hover:bg-zinc-100"
            style={{ background: '#fff', color: '#000', minWidth: 40 }}
          >
            →
          </button>
        </form>
      )}
    </div>
  )
}
