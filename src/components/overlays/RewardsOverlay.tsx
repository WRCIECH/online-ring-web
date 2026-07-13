import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { RewardTier } from '../../types/game'
import { useT } from '../../i18n'
import s from './RewardsOverlay.module.css'

interface Props { onClose: () => void }

const ALL_TIERS: RewardTier[] = ['C', 'B1', 'B2', 'A1', 'A2', 'S']

const TIER_COLOUR: Record<RewardTier, string> = {
  C:  '#aaaaaa',
  B1: '#4488cc', B2: '#4488cc',
  A1: '#9944cc', A2: '#9944cc',
  S:  '#ee8822',
}

const CAN_MERGE: Record<RewardTier, boolean> = {
  C: true, B1: true, B2: true, A1: true, A2: true, S: false,
}

export default function RewardsOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t     = useT()

  const [editingTier, setEditingTier]   = useState<RewardTier | null>(null)
  const [editingVal,  setEditingVal]    = useState('')
  const [confirmUse,  setConfirmUse]    = useState<RewardTier | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingTier) inputRef.current?.focus() }, [editingTier])

  function startEdit(tier: RewardTier) {
    setEditingTier(tier)
    setEditingVal(store.reward_names[tier] ?? '')
  }

  function saveEdit(tier: RewardTier) {
    const name = editingVal.trim()
    store.renameReward(tier, name)
    setEditingTier(null)
    setEditingVal('')
  }

  function handleUse(tier: RewardTier) {
    if (confirmUse === tier) {
      store.useReward(tier)
      setConfirmUse(null)
    } else {
      setConfirmUse(tier)
    }
  }

  function defaultName(tier: RewardTier): string {
    return t.ui[`reward_tier_${tier}`] ?? `Tier ${tier}`
  }

  function displayName(tier: RewardTier): string {
    return store.reward_names[tier] || defaultName(tier)
  }

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>

        <div className={s.header}>
          <div className={s.title}>{t.ui.rewards_title ?? 'REWARDS'}</div>
          <button className={s.btnClose} onClick={onClose}>{t.ui.btn_close}</button>
        </div>

        <hr className={s.sep} />

        <div className={s.grid}>
          {ALL_TIERS.map(tier => {
            const count   = store.rewards[tier] ?? 0
            const canUse  = count >= 1
            const canMerg = CAN_MERGE[tier] && count >= 3
            const isEditing  = editingTier === tier
            const isConfirm  = confirmUse === tier
            const colour  = TIER_COLOUR[tier]

            return (
              <div key={tier} className={s.card} style={{ borderColor: colour + '44' }}>
                <div className={s.cardTop}>
                  <span className={s.tierBadge} style={{ color: colour, borderColor: colour + '66' }}>
                    {tier}
                  </span>
                  <span className={s.count}>×{count}</span>
                </div>

                {isEditing ? (
                  <input
                    ref={inputRef}
                    className={s.nameInput}
                    value={editingVal}
                    placeholder={defaultName(tier)}
                    onChange={e => setEditingVal(e.target.value)}
                    onBlur={() => saveEdit(tier)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  saveEdit(tier)
                      if (e.key === 'Escape') { setEditingTier(null); setEditingVal('') }
                    }}
                  />
                ) : (
                  <button
                    className={s.nameBtn}
                    title={t.ui.reward_click_rename ?? 'Click to rename'}
                    onClick={() => startEdit(tier)}
                  >
                    {displayName(tier)}
                  </button>
                )}

                <div className={s.actions}>
                  <button
                    className={[s.btn, isConfirm ? s.btnConfirm : ''].filter(Boolean).join(' ')}
                    disabled={!canUse}
                    onClick={() => handleUse(tier)}
                    onBlur={() => setConfirmUse(null)}
                  >
                    {isConfirm
                      ? (t.ui.reward_use_confirm ?? 'Confirm?')
                      : (t.ui.reward_use ?? 'Use')}
                  </button>

                  {CAN_MERGE[tier] && (
                    <button
                      className={s.btn}
                      disabled={!canMerg}
                      onClick={() => store.mergeRewards(tier)}
                    >
                      {t.ui.reward_merge ?? 'Merge ×3'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
