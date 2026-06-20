import type { Series, SeriesStatus } from './types'
import type { AppConfig } from './config'

export interface SeriesUpdate {
  id: string
  fields: Partial<Omit<Series, 'id' | 'tvmazeId' | 'posterPath' | 'overview' | 'genres' | 'nextAirDate' | 'nextSeasonNumber'>>
}

export interface SeriesAddition {
  title: string
  status?: SeriesStatus
  platform?: string | null
  currentSeason?: number | null
  currentEpisode?: number | null
  watchedWithPau?: boolean
  notes?: string
}

export interface ConfigUpdate {
  watchingLimit?: number
  defaultSort?: AppConfig['defaultSort']
}

export interface ChatResult {
  text: string
  updates?: SeriesUpdate[]
  additions?: SeriesAddition[]
  deletions?: string[]
  configUpdate?: ConfigUpdate
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  text: string
}

const TOOLS = [
  {
    name: 'update_series',
    description: 'Actualiza campos de una o más series existentes. Usa los IDs exactos de la lista.',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fields: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['viendo', 'completa', 'pendiente', 'pausada'] },
                  currentSeason: { type: ['number', 'null'] },
                  currentEpisode: { type: ['number', 'null'] },
                  platform: { type: ['string', 'null'] },
                  notes: { type: 'string' },
                  watchedWithPau: { type: 'boolean' },
                  lastWatched: { type: ['string', 'null'] },
                },
              },
            },
            required: ['id', 'fields'],
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'add_series',
    description: 'Agrega una o más series nuevas a la lista.',
    input_schema: {
      type: 'object',
      properties: {
        series: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              status: { type: 'string', enum: ['viendo', 'completa', 'pendiente', 'pausada'] },
              platform: { type: ['string', 'null'] },
              currentSeason: { type: ['number', 'null'] },
              currentEpisode: { type: ['number', 'null'] },
              watchedWithPau: { type: 'boolean' },
              notes: { type: 'string' },
            },
            required: ['title'],
          },
        },
      },
      required: ['series'],
    },
  },
  {
    name: 'delete_series',
    description: 'Elimina una o más series de la lista por ID.',
    input_schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['ids'],
    },
  },
  {
    name: 'set_config',
    description: 'Cambia la configuración de la app: límite de series activas, orden por defecto.',
    input_schema: {
      type: 'object',
      properties: {
        watchingLimit: { type: 'number', description: 'Máximo de series en estado "viendo" a la vez (1-20)' },
        defaultSort: { type: 'string', enum: ['recent', 'oldest', 'az', 'platform'] },
      },
    },
  },
]

function buildSystemPrompt(series: Series[], today: string, config?: AppConfig): string {
  const compact = series.map(s => ({
    id: s.id,
    title: s.title,
    status: s.status,
    platform: s.platform ?? null,
    season: s.currentSeason ?? null,
    episode: s.currentEpisode ?? null,
    withPau: s.watchedWithPau,
    lastWatched: s.lastWatched ?? null,
    nextSeason: s.nextAirDate ? `T${s.nextSeasonNumber} el ${s.nextAirDate}` : null,
    notes: s.notes ? s.notes.slice(0, 120) : null,
  }))

  const configLine = config?.watchingLimit
    ? `\nCONFIG ACTUAL: límite de series activas = ${config.watchingLimit}, orden = ${config.defaultSort ?? 'recent'}`
    : ''

  return `Eres el asistente personal de seguimiento de series de TV. Hoy es ${today}.${configLine}

ESTADOS: "viendo"=actualmente viendo | "completa"=terminada | "pendiente"=por ver | "pausada"=en pausa

LISTA (${series.length} series):
${JSON.stringify(compact)}

INSTRUCCIONES:
- Responde siempre en español, de forma breve y directa
- Al cambiar estado a "viendo" o "completa", actualiza lastWatched a hoy (${today})
- Para buscar series: ignora tildes, mayúsculas, artículos. "squid game"→"Juego del Calamar", etc.
- Si no encuentras una serie exacta, busca por similitud en la lista
- "withPau" = vista con Pau (pareja); "nextSeason" = próxima temporada anunciada
- Puedes cambiar la configuración de la app con set_config (límite de series, orden por defecto)
- Puedes hacer múltiples cambios en un mensaje
- NOTAS: el campo "notes" es un registro cronológico. Cuando te pidan agregar una nota, escribe el campo así: "${today} · nueva nota\n[notas anteriores]". Nunca borres entradas previas.`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnthropicContent = any[]

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicContent
}

export async function sendChatMessage(
  userMessage: string,
  history: ChatHistoryItem[],
  series: Series[],
  apiKey: string,
  config?: AppConfig,
  today = new Date().toISOString().slice(0, 10)
): Promise<ChatResult> {
  const systemPrompt = buildSystemPrompt(series, today, config)

  const messages: AnthropicMessage[] = [
    ...history.map(h => ({ role: h.role, content: h.text })),
    { role: 'user', content: userMessage },
  ]

  async function callAPI(msgs: AnthropicMessage[]) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages: msgs,
      }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`Claude API ${res.status}: ${err}`)
    }
    return res.json()
  }

  const result: ChatResult = { text: '' }
  let response = await callAPI(messages)

  // Handle tool use (may be multiple rounds, but one is enough for our tools)
  if (response.stop_reason === 'tool_use') {
    const toolResults: AnthropicContent = []

    for (const block of response.content as AnthropicContent) {
      if (block.type !== 'tool_use') continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inp = block.input as any
      let output = 'OK'

      if (block.name === 'update_series' && inp.updates) {
        result.updates = result.updates ?? []
        result.updates.push(...inp.updates)
        output = `Actualizado ${inp.updates.length} serie(s)`
      } else if (block.name === 'add_series' && inp.series) {
        result.additions = result.additions ?? []
        result.additions.push(...inp.series)
        output = `Agregada(s) ${inp.series.length} serie(s)`
      } else if (block.name === 'delete_series' && inp.ids) {
        result.deletions = result.deletions ?? []
        result.deletions.push(...inp.ids)
        output = `Eliminada(s) ${inp.ids.length} serie(s)`
      } else if (block.name === 'set_config') {
        result.configUpdate = result.configUpdate ?? {}
        if (inp.watchingLimit != null) result.configUpdate.watchingLimit = inp.watchingLimit
        if (inp.defaultSort) result.configUpdate.defaultSort = inp.defaultSort
        output = 'Configuración actualizada'
      }

      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: output })
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })
    response = await callAPI(messages)
  }

  for (const block of response.content as AnthropicContent) {
    if (block.type === 'text') { result.text = block.text; break }
  }

  return result
}
