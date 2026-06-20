import type { SortOrder, SectionKey } from './types'

export interface AppConfig {
  watchingLimit: number | null
  defaultSort?: SortOrder
  sectionOrder?: SectionKey[]
  collapsedSections?: SectionKey[]
  sectionSorts?: Partial<Record<SectionKey, SortOrder>>
}

const KEY = 'series_tracker_config_v1'

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { watchingLimit: null }
  } catch { return { watchingLimit: null } }
}

export function saveConfig(c: AppConfig) {
  localStorage.setItem(KEY, JSON.stringify(c))
}
