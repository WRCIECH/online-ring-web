import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { DEFAULT_MUSIC_TRACKS } from '../../data/combatMusic'
import { useT } from '../../i18n'
import s from './MusicOverlay.module.css'

function parseYouTubeId(raw: string): string {
  const trimmed = raw.trim()
  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  // youtube.com/watch?v=ID
  const longMatch = trimmed.match(/[?&]v=([A-Za-z0-9_-]{11})/)
  if (longMatch) return longMatch[1]
  // plain 11-char video ID
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed
  return trimmed
}

function toDisplayUrl(id: string): string {
  if (!id) return ''
  if (id.startsWith('http')) return id
  return `https://www.youtube.com/watch?v=${id}`
}

interface Props { onClose: () => void }

export default function MusicOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t     = useT()
  const tui   = t.ui as Record<string, string>

  const tracks = store.music_tracks ?? DEFAULT_MUSIC_TRACKS

  // Local draft — raw input values (full URLs while typing, IDs on save)
  const [draft, setDraft] = useState<string[]>(() => tracks.map(toDisplayUrl))

  function commit(updated: string[]) {
    setDraft(updated)
    const ids = updated.map(parseYouTubeId).filter(Boolean)
    if (ids.length > 0) store.setMusicTracks(ids)
  }

  function handleChange(i: number, value: string) {
    const next = [...draft]
    next[i] = value
    commit(next)
  }

  function handleDelete(i: number) {
    if (draft.length <= 1) return
    commit(draft.filter((_, idx) => idx !== i))
  }

  function handleAdd() {
    commit([...draft, ''])
  }

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>
        <div className={s.header}>
          <span className={s.title}>{tui.music_settings_title ?? 'Music Tracks'}</span>
          <button className={s.btnClose} onClick={onClose}>✕</button>
        </div>
        <p className={s.hint}>
          {tui.music_url_placeholder ?? 'Paste a YouTube URL or video ID for each track. The playlist cycles deterministically per run.'}
        </p>
        <div className={s.list}>
          {draft.map((url, i) => (
            <div key={i} className={s.trackRow}>
              <span className={s.indexChip}>#{i + 1}</span>
              <input
                className={s.urlInput}
                value={url}
                onChange={e => handleChange(i, e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                spellCheck={false}
              />
              <button
                className={s.btnDelete}
                onClick={() => handleDelete(i)}
                disabled={draft.length <= 1}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className={s.btnAdd} onClick={handleAdd}>
          {tui.music_add_track ?? 'Add track'}
        </button>
      </div>
    </div>
  )
}
