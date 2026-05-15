import { useState, useCallback, useRef, useEffect } from 'react'
import { loadLog, saveLog } from '../../engine/save'
import s from './NotepadOverlay.module.css'

interface Props { onClose: () => void }

export default function NotepadOverlay({ onClose }: Props) {
  const [content, setContent] = useState(() => loadLog())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((val: string) => {
    setContent(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveLog(val), 1500)
  }, [])

  function handleClose() {
    saveLog(content)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    onClose()
  }

  function handleCopy() {
    navigator.clipboard.writeText(content)
  }

  function handleClear() {
    if (!confirm('Clear all notes? This cannot be undone.')) return
    setContent('')
    saveLog('')
  }

  useEffect(() => () => {
    saveLog(content)
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [content])

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className={s.panel}>
        <div className={s.title}>✏ Notes</div>
        <hr />
        <textarea
          className={s.textarea}
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder="Your notes will appear here after each completed task…"
        />
        <div className={s.footer}>
          <button onClick={handleClear} style={{ color: 'var(--color-text-danger)', marginRight: 'auto' }}>
            Clear all
          </button>
          <button onClick={handleCopy}>Copy all</button>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
