import { useState, useRef, useEffect } from 'react'
import { useGameStore, selectEquipLoad } from '../../store/gameStore'
import type { ContentPhase, ContentItem, LearningItem } from '../../types/game'
import { useT } from '../../i18n'
import s from './ContentOverlay.module.css'

interface Props {
  onClose:  () => void
  canAdd?:  boolean   // false during active combat task timer
}

const PHASES: ContentPhase[] = [
  'Research', 'Outline', 'Produce', 'Glue', 'Refine', 'Publish', 'Published',
]


const PHASE_COLOR: Record<ContentPhase, string> = {
  Research:  '#5599dd',
  Outline:   '#44aaaa',
  Produce:   '#cc9933',
  Glue:      '#669966',
  Refine:    '#7799bb',
  Publish:   '#66aa55',
  Published: '#555566',
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ContentOverlay({ onClose, canAdd = true }: Props) {
  const store  = useGameStore()
  const t      = useT()
  const load   = selectEquipLoad(store as Parameters<typeof selectEquipLoad>[0])

  const [activeTab,        setActiveTab]        = useState<'content' | 'learning'>('content')
  const [showPublished,    setShowPublished]    = useState(false)
  const [confirmDeleteId,  setConfirmDeleteId]  = useState<string | null>(null)
  const [editingNameId,    setEditingNameId]    = useState<string | null>(null)
  const [editingNameVal,   setEditingNameVal]   = useState('')
  const [addingNew,        setAddingNew]        = useState(false)
  const [newName,          setNewName]          = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  // Learning tab state
  const [addingLearn,      setAddingLearn]      = useState(false)
  const [newLearnName,     setNewLearnName]     = useState('')
  const learnInputRef = useRef<HTMLInputElement>(null)

  const active    = store.content_items.filter(c => c.phase !== 'Published')
  const published = store.content_items.filter(c => c.phase === 'Published')
    .sort((a, b) => (b.published_at ?? 0) - (a.published_at ?? 0))

  const loadPct = load.capacity > 0 ? Math.min(1, load.used / load.capacity) : 0
  const overloaded = load.used > load.capacity

  // Auto-focus new item input
  useEffect(() => {
    if (addingNew) newInputRef.current?.focus()
  }, [addingNew])

  // Auto-focus name edit input
  useEffect(() => {
    if (editingNameId) nameInputRef.current?.focus()
  }, [editingNameId])

  // Auto-focus learning input
  useEffect(() => {
    if (addingLearn) learnInputRef.current?.focus()
  }, [addingLearn])

  function handleAddConfirm() {
    const name = newName.trim()
    if (!name) { setAddingNew(false); setNewName(''); setNewIsSource(false); return }
    store.addContentItem(name)
    setNewName('')
    setNewIsSource(false)
    setAddingNew(false)
  }

  function handleLearnConfirm() {
    const name = newLearnName.trim()
    if (!name) { setAddingLearn(false); setNewLearnName(''); return }
    store.addLearningItem(name)
    setNewLearnName('')
    setAddingLearn(false)
  }

  function renderLearningItem(item: LearningItem) {
    return (
      <div key={item.id} className={s.learnItem}>
        <span className={s.learnName}>{item.name}</span>
        <div className={s.learnActions}>
          <button
            className={s.btnDone}
            onClick={() => store.completeLearningItem(item.id)}
            title={t.ui.learning_btn_done}
          >
            {t.ui.learning_btn_done}
          </button>
          <button
            className={s.btnDelete}
            onClick={() => store.removeLearningItem(item.id)}
            title={t.ui.btn_delete ?? 'Delete'}
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  const completedLearning = store.learning_items.filter(li => !!li.completed_at)
    .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0))
  const activeLearning = store.learning_items.filter(li => !li.completed_at)

  function handleNameEdit(item: ContentItem) {
    setEditingNameId(item.id)
    setEditingNameVal(item.name)
  }

  function handleNameSave(id: string) {
    const name = editingNameVal.trim()
    if (name) store.updateContentItem(id, { name })
    setEditingNameId(null)
    setEditingNameVal('')
  }

  function handlePhaseChange(id: string, phase: ContentPhase) {
    if (phase === 'Published') {
      store.publishContentItem(id)
    } else {
      store.updateContentItem(id, { phase })
    }
  }

  function handleDelete(item: ContentItem) {
    if (item.phase === 'Research' || confirmDeleteId === item.id) {
      store.removeContentItem(item.id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(item.id)
    }
  }

  function renderStamps(item: ContentItem) {
    const chips: { label: string; color?: string }[] = []
    if (item.stamped_product) {
      const info = t.content.product[item.stamped_product]
      chips.push({ label: info?.badge_label ?? item.stamped_product, color: '#888899' })
    }
    if (item.stamped_origin) {
      const info = t.content.origin[item.stamped_origin]
      chips.push({ label: info?.badge_label ?? item.stamped_origin, color: '#7788aa' })
    }
    if (item.stamped_status) {
      const info = t.content.status[item.stamped_status]
      chips.push({ label: info?.badge_label ?? item.stamped_status, color: '#886688' })
    }
    if (!chips.length) return null
    return (
      <div className={s.stamps}>
        {chips.map((c, i) => (
          <span key={i} className={s.stamp} style={c.color ? { color: c.color, borderColor: c.color + '55' } : undefined}>
            {c.label}
          </span>
        ))}
      </div>
    )
  }

  function renderItem(item: ContentItem) {
    const isEditName  = editingNameId === item.id
    const isConfirmDel = confirmDeleteId === item.id
    const color = PHASE_COLOR[item.phase]

    return (
      <div key={item.id} className={s.item}>
        <div className={s.itemRow}>
          {/* Phase chip / selector */}
          <select
            className={s.phaseSelect}
            value={item.phase}
            style={{ color, borderColor: color + '66' }}
            onChange={e => handlePhaseChange(item.id, e.target.value as ContentPhase)}
          >
            {PHASES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Name */}
          {isEditName ? (
            <input
              ref={nameInputRef}
              className={s.nameInput}
              value={editingNameVal}
              onChange={e => setEditingNameVal(e.target.value)}
              onBlur={() => handleNameSave(item.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleNameSave(item.id)
                if (e.key === 'Escape') { setEditingNameId(null); setEditingNameVal('') }
              }}
            />
          ) : (
            <span
              className={s.itemName}
              onClick={() => handleNameEdit(item)}
              title={t.ui.click_to_rename}
            >
              {item.name || <em className={s.unnamed}>{t.ui.untitled}</em>}
            </span>
          )}

          {/* Actions */}
          <div className={s.itemActions}>
            {isConfirmDel ? (
              <>
                <button className={s.btnConfirmDel} onClick={() => handleDelete(item)}>
                  Delete?
                </button>
                <button className={s.btnCancelDel} onClick={() => setConfirmDeleteId(null)}>
                  ✕
                </button>
              </>
            ) : (
              <button
                className={s.btnDelete}
                onClick={() => handleDelete(item)}
                title="Delete"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Stamps */}
        {renderStamps(item)}

      </div>
    )
  }

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className={s.header}>
          <div className={s.title}>{activeTab === 'content' ? t.ui.pipeline_title : t.ui.learning_title}</div>
          <button className={s.btnClose} onClick={onClose}>{t.ui.btn_close}</button>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className={s.tabBar}>
          <button
            className={[s.tab, activeTab === 'content' ? s.tabActive : ''].join(' ')}
            onClick={() => setActiveTab('content')}
          >
            {t.ui.tab_content}
          </button>
          <button
            className={[s.tab, activeTab === 'learning' ? s.tabActive : ''].join(' ')}
            onClick={() => setActiveTab('learning')}
          >
            {t.ui.tab_learning}
          </button>
        </div>

        {/* ── Equip load bar ──────────────────────────────────────── */}
        <div className={s.loadSection}>
          <div className={s.loadLabel}>
            <span>{t.ui.equip_load_label}</span>
            <span className={overloaded ? s.loadOver : s.loadVal}>
              {load.used.toFixed(1)} / {load.capacity.toFixed(1)}
            </span>
          </div>
          <div className={s.loadTrack}>
            <div
              className={[s.loadFill, overloaded ? s.loadFillOver : ''].join(' ')}
              style={{ width: `${Math.min(100, loadPct * 100)}%` }}
            />
          </div>
          {overloaded && (
            <div className={s.overloadWarning}>{t.ui.overload_warning}</div>
          )}
        </div>

        <hr className={s.sep} />

        {/* ── Content tab ─────────────────────────────────────────── */}
        {activeTab === 'content' && <>

        {/* ── Active items ────────────────────────────────────────── */}
        <div className={s.itemList}>
          {active.length === 0 && !addingNew && (
            <div className={s.empty}>{t.ui.empty_pipeline}</div>
          )}
          {active.map(renderItem)}

          {/* New item row */}
          {addingNew ? (
            <div className={s.newRow}>
              <input
                ref={newInputRef}
                className={s.nameInput}
                placeholder={t.ui.article_placeholder}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onBlur={handleAddConfirm}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddConfirm()
                  if (e.key === 'Escape') { setAddingNew(false); setNewName('') }
                }}
              />
            </div>
          ) : (
            <button
              className={[s.btnAdd, !canAdd ? s.btnAddDisabled : ''].join(' ')}
              disabled={!canAdd}
              onClick={() => setAddingNew(true)}
              title={!canAdd ? t.ui.add_article_disabled : undefined}
            >
              {t.ui.btn_add_article}
            </button>
          )}
        </div>

        {/* ── Published section ────────────────────────────────────── */}
        {published.length > 0 && (
          <>
            <hr className={s.sep} />
            <button className={s.collapseToggle} onClick={() => setShowPublished(p => !p)}>
              {showPublished ? '▲' : '▼'} {t.ui.published_label} ({published.length})
            </button>
            {showPublished && (
              <div className={s.itemList}>
                {published.map(item => (
                  <div key={item.id} className={[s.item, s.itemPublished].join(' ')}>
                    <div className={s.itemRow}>
                      <span
                        className={s.phaseChip}
                        style={{ color: PHASE_COLOR.Published, borderColor: PHASE_COLOR.Published + '66' }}
                      >
                        {t.ui.published_label}
                      </span>
                      <span className={s.itemName}>{item.name}</span>
                      <span className={s.publishedDate}>
                        {item.published_at ? fmtDate(item.published_at) : ''}
                      </span>
                      <button
                        className={s.btnDelete}
                        title="Remove"
                        onClick={() => store.removeContentItem(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        </>}

        {/* ── Learning tab ─────────────────────────────────────────── */}
        {activeTab === 'learning' && <>
          <div className={s.itemList}>
            {activeLearning.length === 0 && !addingLearn && (
              <div className={s.empty}>{t.ui.empty_learning}</div>
            )}
            {activeLearning.map(renderLearningItem)}

            {addingLearn ? (
              <div className={s.newRow}>
                <input
                  ref={learnInputRef}
                  className={s.nameInput}
                  placeholder={t.ui.learning_placeholder}
                  value={newLearnName}
                  onChange={e => setNewLearnName(e.target.value)}
                  onBlur={handleLearnConfirm}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleLearnConfirm()
                    if (e.key === 'Escape') { setAddingLearn(false); setNewLearnName('') }
                  }}
                />
              </div>
            ) : (
              <button className={s.btnAdd} onClick={() => setAddingLearn(true)}>
                {t.ui.btn_add_learning}
              </button>
            )}
          </div>

          {completedLearning.length > 0 && (
            <>
              <hr className={s.sep} />
              <div className={s.itemList}>
                {completedLearning.map(item => (
                  <div key={item.id} className={[s.learnItem, s.learnItemDone].join(' ')}>
                    <span className={s.learnName}>{item.name}</span>
                    <div className={s.learnActions}>
                      <span className={s.learnDoneDate}>{item.completed_at ? fmtDate(item.completed_at) : ''}</span>
                      <button
                        className={s.btnDelete}
                        onClick={() => store.removeLearningItem(item.id)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>}

      </div>
    </div>
  )
}
