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

// Full notes log — append-only during gameplay, editable in the overlay
const LOG_KEY = 'notes_log'

export function loadLog(): string {
  return localStorage.getItem(LOG_KEY) ?? ''
}

export function saveLog(content: string): void {
  localStorage.setItem(LOG_KEY, content)
}

export function appendToLog(taskName: string, notes: string): void {
  const text = notes.trim()
  if (!text) return
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const header = `\n── ${taskName} · ${timestamp} ──\n`
  localStorage.setItem(LOG_KEY, loadLog() + header + text + '\n')
}
