import { useState, useCallback, useRef, useEffect } from 'react'
import { loadNote, saveNote } from '../../engine/save'
import s from './NotepadOverlay.module.css'

const TABS = ['Draft', 'Ideas', 'Outline', 'Research'] as const
type Tab = typeof TABS[number]

const HINTS: Record<Tab, string> = {
  Draft:    'Write your piece here…',
  Ideas:    'Dump raw ideas — no filter…',
  Outline:  'Structure, sections, beats…',
  Research: 'Facts, references, quotes…',
}

interface Props { onClose: () => void }

export default function NotepadOverlay({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Draft')
  const [content, setContent]     = useState(() => loadNote('Draft'))
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentTab = useRef<Tab>('Draft')

  function switchTab(tab: Tab) {
    // Flush current tab immediately before switching
    saveNote(currentTab.current, content)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    currentTab.current = tab
    setActiveTab(tab)
    setContent(loadNote(tab))
  }

  const handleChange = useCallback((val: string) => {
    setContent(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNote(currentTab.current, val), 1500)
  }, [])

  function handleClose() {
    saveNote(currentTab.current, content)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    onClose()
  }

  function handleCopy() {
    navigator.clipboard.writeText(content)
  }

  // Save on unmount
  useEffect(() => () => {
    saveNote(currentTab.current, content)
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [content])

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className={s.panel}>
        <div className={s.title}>✏ Notepad</div>
        <div className={s.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={[s.tab, tab === activeTab ? s.active : ''].join(' ')}
              onClick={() => switchTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <hr />
        <textarea
          className={s.textarea}
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder={HINTS[activeTab]}
        />
        <div className={s.footer}>
          <button onClick={handleCopy}>Copy Tab</button>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
