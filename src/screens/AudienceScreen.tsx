import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import type { AudienceSectionKey } from '../types/game'
import s from './AudienceScreen.module.css'

const SECTIONS: { key: AudienceSectionKey; label: string }[] = [
  { key: 'sociological_trends', label: 'Sociological Trends' },
  { key: 'long_term_trends',    label: 'Long-term Trends' },
  { key: 'short_term_trends',   label: 'Short-term Trends / Events' },
  { key: 'needs_explanations',  label: 'Needs & Required Explanations' },
  { key: 'identities_values',   label: 'Identities & Values' },
  { key: 'attitudes_beliefs',   label: 'Attitudes, Beliefs, Feelings & Images' },
  { key: 'symbols_slogans',     label: 'Symbols & Slogans' },
  { key: 'heroes_enemies',      label: 'Heroes & Enemies' },
  { key: 'myths_reflexes',      label: 'Myths & Reflexes' },
  { key: 'narratives_frames',   label: 'Narratives & Frames' },
]

export default function AudienceScreen() {
  const navigate  = useNavigate()
  const store     = useGameStore()
  const audiences = store.audiences ?? []

  const [selectedId, setSelectedId] = useState<string | null>(audiences[0]?.id ?? null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal,  setRenameVal]  = useState('')
  const [addInputs,  setAddInputs]  = useState<Partial<Record<AudienceSectionKey, string>>>({})
  const renameRef = useRef<HTMLInputElement>(null)

  const selected = audiences.find(a => a.id === selectedId) ?? null

  function handleCreate() {
    const id = crypto.randomUUID()
    store.createAudience(id, 'New Audience')
    setSelectedId(id)
    setRenamingId(id)
    setRenameVal('New Audience')
    setTimeout(() => renameRef.current?.select(), 0)
  }

  function commitRename() {
    if (renamingId && renameVal.trim()) store.renameAudience(renamingId, renameVal.trim())
    setRenamingId(null)
  }

  function handleAddItem(section: AudienceSectionKey) {
    if (!selectedId) return
    const text = (addInputs[section] ?? '').trim()
    if (!text) return
    store.addAudienceItem(selectedId, section, text)
    setAddInputs(prev => ({ ...prev, [section]: '' }))
  }

  return (
    <div className={s.screen}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={s.title}>Audience Profiles</h1>
      </div>

      <div className={s.body}>
        {/* ── Left sidebar ── */}
        <aside className={s.sidebar}>
          <button className={s.newBtn} onClick={handleCreate}>+ New Audience</button>
          {audiences.length === 0 && (
            <p className={s.empty}>No audiences yet.</p>
          )}
          <ul className={s.audienceList}>
            {audiences.map(a => (
              <li
                key={a.id}
                className={[s.audienceItem, a.id === selectedId ? s.audienceItemActive : ''].filter(Boolean).join(' ')}
                onClick={() => setSelectedId(a.id)}
              >
                {renamingId === a.id ? (
                  <input
                    ref={renameRef}
                    className={s.renameInput}
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={s.audienceName}
                    onDoubleClick={e => { e.stopPropagation(); setRenamingId(a.id); setRenameVal(a.name) }}
                  >
                    {a.name}
                  </span>
                )}
                <div className={s.audienceActions}>
                  <button
                    className={s.iconBtn}
                    title="Rename"
                    onClick={e => { e.stopPropagation(); setRenamingId(a.id); setRenameVal(a.name) }}
                  >✎</button>
                  <button
                    className={s.iconBtn}
                    title="Delete"
                    onClick={e => {
                      e.stopPropagation()
                      store.deleteAudience(a.id)
                      if (selectedId === a.id)
                        setSelectedId(audiences.find(x => x.id !== a.id)?.id ?? null)
                    }}
                  >✕</button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Right panel ── */}
        <main className={s.main}>
          {!selected ? (
            <p className={s.placeholder}>Select or create an audience profile.</p>
          ) : (
            <div className={s.sections}>
              {SECTIONS.map(({ key, label }) => {
                const items = selected.sections[key] ?? []
                return (
                  <section key={key} className={s.section}>
                    <h2 className={s.sectionTitle}>{label}</h2>
                    {items.length > 0 && (
                      <ul className={s.itemList}>
                        {items.map(item => (
                          <li key={item.id} className={s.item}>
                            <span className={s.itemText}>{item.text}</span>
                            <button
                              className={s.itemDelete}
                              onClick={() => store.deleteAudienceItem(selected.id, key, item.id)}
                            >✕</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className={s.addRow}>
                      <input
                        className={s.addInput}
                        placeholder="Add item…"
                        value={addInputs[key] ?? ''}
                        onChange={e => setAddInputs(prev => ({ ...prev, [key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddItem(key) }}
                      />
                      <button className={s.addBtn} onClick={() => handleAddItem(key)}>Add</button>
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
