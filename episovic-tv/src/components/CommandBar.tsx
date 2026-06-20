import { useState, useRef } from 'react'
import type { Series } from '../types'
import { parseCommand, describeAction } from '../nlp'

const EXAMPLES = [
  'terminé Yellowstone',
  'empecé The Bear temporada 2 en Hulu',
  'añade Severance en Apple TV',
  'voy en temporada 3 episodio 5 de Billions',
  'pausé Gomorra',
]

interface Props {
  series: Series[]
  onAction: (action: ReturnType<typeof parseCommand>) => void
}

export function CommandBar({ series, onAction }: Props) {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<ReturnType<typeof parseCommand> | null>(null)
  const [exampleIdx, setExampleIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(val: string) {
    setInput(val)
    if (val.trim().length < 3) { setPreview(null); setPendingAction(null); return }
    const action = parseCommand(val, series)
    const desc = describeAction(action)
    setPreview(desc)
    setPendingAction(action.type !== 'unknown' ? action : null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingAction) return
    onAction(pendingAction)
    setInput('')
    setPreview(null)
    setPendingAction(null)
    setExampleIdx(i => (i + 1) % EXAMPLES.length)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-4 py-3">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {preview && (
          <div className={`mb-2 text-xs px-3 py-1.5 rounded-lg ${
            pendingAction
              ? 'bg-zinc-800 text-zinc-300'
              : 'bg-zinc-900 text-zinc-500'
          }`}>
            {preview}
            {pendingAction && <span className="text-zinc-500 ml-2">· Enter para confirmar</span>}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => handleChange(e.target.value)}
            placeholder={`Ej: ${EXAMPLES[exampleIdx]}`}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!pendingAction}
            className="bg-white text-black font-semibold text-sm px-4 py-2.5 rounded-xl disabled:opacity-30 hover:bg-zinc-200 transition-colors"
          >
            OK
          </button>
        </div>
      </form>
    </div>
  )
}
