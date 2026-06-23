import { useState, useRef, useEffect } from 'react'
import { useGameStore, selectEquipLoad, selectWeaponSlotLoad } from '../../store/gameStore'
import { WEAPONS } from '../../data/weapons'
import type { ContentItem, WeaponInstance } from '../../types/game'
import { useT } from '../../i18n'
import s from './ContentOverlay.module.css'

interface Props {
  onClose:  () => void
  canAdd?:  boolean
}

export default function ContentOverlay({ onClose, canAdd = true }: Props) {
  const store = useGameStore()
  const t     = useT()
  const load  = selectEquipLoad(store as Parameters<typeof selectEquipLoad>[0])

  const equippedWeaponId = store.equipped_run_weapons[0]
  const slotLoad = equippedWeaponId
    ? selectWeaponSlotLoad(store as Parameters<typeof selectWeaponSlotLoad>[0], equippedWeaponId)
    : null

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingNameId,   setEditingNameId]   = useState<string | null>(null)
  const [editingNameVal,  setEditingNameVal]  = useState('')
  const [addingNew,       setAddingNew]       = useState(false)
  const [newName,         setNewName]         = useState('')
  const newInputRef  = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const loadPct    = load.capacity > 0 ? Math.min(1, load.used / load.capacity) : 0
  const overloaded = load.used > load.capacity

  useEffect(() => { if (addingNew)     newInputRef.current?.focus()  }, [addingNew])
  useEffect(() => { if (editingNameId) nameInputRef.current?.focus() }, [editingNameId])

  function handleAddConfirm() {
    const name = newName.trim()
    if (!name) { setAddingNew(false); setNewName(''); return }
    store.addContentItem(name)
    setNewName('')
    setAddingNew(false)
  }

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

  function handleDelete(item: ContentItem) {
    if (confirmDeleteId === item.id) {
      store.removeContentItem(item.id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(item.id)
    }
  }

  function handleRemaster(item: ContentItem) {
    if (!item.attached_weapon_id) return
    const weapon = WEAPONS[item.attached_weapon_id] as WeaponInstance | undefined
    if (!weapon) return
    store.startRemaster(item.id, weapon.weapon_class)
    onClose()
  }

  function renderItem(item: ContentItem) {
    const isEditName   = editingNameId === item.id
    const isConfirmDel = confirmDeleteId === item.id

    return (
      <div key={item.id} className={[s.item, item.completed ? s.itemPublished : ''].join(' ')}>
        <div className={s.itemRow}>
          <span className={s.phaseChip} title={t.ui.weapon_slot_label}>
            {item.attached_weapon_id
              ? (WEAPONS[item.attached_weapon_id] as WeaponInstance | undefined)?.name ?? item.attached_weapon_id
              : t.ui.weapon_unattached}
          </span>

          {isEditName ? (
            <input
              ref={nameInputRef}
              className={s.nameInput}
              value={editingNameVal}
              onChange={e => setEditingNameVal(e.target.value)}
              onBlur={() => handleNameSave(item.id)}
              onKeyDown={e => {
                if (e.key === 'Enter')  handleNameSave(item.id)
                if (e.key === 'Escape') { setEditingNameId(null); setEditingNameVal('') }
              }}
            />
          ) : (
            <span
              className={s.itemName}
              onClick={() => !item.completed && handleNameEdit(item)}
              title={item.completed ? undefined : t.ui.click_to_rename}
            >
              {item.name || <em className={s.unnamed}>{t.ui.untitled}</em>}
            </span>
          )}

          {item.completed && <span className={s.phaseChip}>{t.ui.content_item_completed}</span>}
          {!!item.remaster_count && (
            <span className={s.phaseChip}>{t.ui.remastered_count}{item.remaster_count}</span>
          )}

          <div className={s.itemActions}>
            {item.completed && (
              <button
                className={s.btnToggle}
                onClick={() => handleRemaster(item)}
                disabled={!item.attached_weapon_id}
                title={item.attached_weapon_id ? undefined : t.ui.weapon_unattached}
              >
                {t.ui.btn_remaster}
              </button>
            )}
            {isConfirmDel ? (
              <>
                <button className={s.btnConfirmDel} onClick={() => handleDelete(item)}>Delete?</button>
                <button className={s.btnCancelDel}  onClick={() => setConfirmDeleteId(null)}>✕</button>
              </>
            ) : (
              <button className={s.btnDelete} onClick={() => handleDelete(item)} title="Delete">✕</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>

        <div className={s.header}>
          <div className={s.title}>{t.ui.pipeline_title}</div>
          <button className={s.btnClose} onClick={onClose}>{t.ui.btn_close}</button>
        </div>

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

        {slotLoad && (
          <div className={s.loadSection}>
            <div className={s.loadLabel}>
              <span>{t.ui.weapon_slot_label}</span>
              <span className={slotLoad.used > slotLoad.capacity ? s.loadOver : s.loadVal}>
                {slotLoad.used} / {slotLoad.capacity}
              </span>
            </div>
            <div className={s.loadTrack}>
              <div
                className={[s.loadFill, slotLoad.used > slotLoad.capacity ? s.loadFillOver : ''].join(' ')}
                style={{ width: `${slotLoad.capacity > 0 ? Math.min(100, (slotLoad.used / slotLoad.capacity) * 100) : 0}%` }}
              />
            </div>
          </div>
        )}

        <hr className={s.sep} />

        <div className={s.itemList}>
          {store.content_items.length === 0 && !addingNew && (
            <div className={s.empty}>{t.ui.empty_pipeline}</div>
          )}
          {store.content_items.map(renderItem)}

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
                  if (e.key === 'Enter')  handleAddConfirm()
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

      </div>
    </div>
  )
}
