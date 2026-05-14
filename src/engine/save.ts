import type { GameState } from '../types/game'

const SAVE_KEY = 'online_ring_save'
const BACKUP_KEY = 'online_ring_save_backup'

export function saveGame(state: GameState): void {
  try {
    const existing = localStorage.getItem(SAVE_KEY)
    if (existing) localStorage.setItem(BACKUP_KEY, existing)
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, saved_at: Date.now() }))
  } catch {
    console.warn('Save failed')
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(BACKUP_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GameState
  } catch {
    return null
  }
}

export function eraseSave(): void {
  localStorage.removeItem(SAVE_KEY)
  localStorage.removeItem(BACKUP_KEY)
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}

// Notes storage (4 tabs)
const NOTE_KEYS: Record<string, string> = {
  Draft:    'notes_draft',
  Ideas:    'notes_ideas',
  Outline:  'notes_outline',
  Research: 'notes_research',
}

export function loadNote(tab: string): string {
  return localStorage.getItem(NOTE_KEYS[tab] ?? 'notes_draft') ?? ''
}

export function saveNote(tab: string, content: string): void {
  localStorage.setItem(NOTE_KEYS[tab] ?? 'notes_draft', content)
}
