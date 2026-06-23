import type { ActiveCurse } from '../../engine/combat'
import { MOB_CURSES, type MobCurseDef } from '../../data/mobCurses'
import { FLOW_GAP_HOT_MINS, FLOW_GAP_WARM_MINS, FLOW_GAP_COLD_MINS } from '../../data/constants'
import s from './CurseDisplay.module.css'

interface Props {
  activeCurses: ActiveCurse[]
  playerStamina: number
  playerMaxStamina: number
  lastTileCompletionAt: number
}

function burnoutIntensity(lastTileCompletionAt: number): number {
  if (!lastTileCompletionAt) return 0
  const gapMin = (Date.now() - lastTileCompletionAt) / 60000
  if (gapMin < FLOW_GAP_HOT_MINS)  return 0
  if (gapMin < FLOW_GAP_WARM_MINS) return 0.33
  if (gapMin < FLOW_GAP_COLD_MINS) return 0.66
  return 1
}

function renderProgress(curse: ActiveCurse, def: MobCurseDef, lastTileCompletionAt: number): string {
  switch (def.condition.type) {
    case 'forwardStreak':  return `${Math.min(curse.forwardStreak, def.condition.count ?? 1)}/${def.condition.count} forward tiles`
    case 'noRepeatStreak': return `${Math.min(curse.noRepeatStreak, def.condition.count ?? 1)}/${def.condition.count} without a repeat`
    case 'firstTile':      return 'Complete your first tile to lift this'
    case 'publish':        return 'Publish a tile to lift this'
    case 'variety':        return 'Make something tagged format/style/emotion to lift this'
    case 'heavyMove':      return 'Commit to one Heavy move to lift this'
    case 'idleGap': {
      const intensity = burnoutIntensity(lastTileCompletionAt)
      if (intensity === 0) return 'In flow — no penalty right now'
      const mins = Math.floor((Date.now() - lastTileCompletionAt) / 60000)
      return `Idle ${mins}m — keep working to cool this down`
    }
  }
}

export default function CurseDisplay({ activeCurses, playerStamina, playerMaxStamina, lastTileCompletionAt }: Props) {
  const unlifted = activeCurses.filter(c => !c.lifted)
  if (unlifted.length === 0) return null

  return (
    <div className={s.curseList}>
      {unlifted.map(curse => {
        const def = MOB_CURSES[curse.enemyId]
        if (!def) return null
        const isIdleGap = def.condition.type === 'idleGap'
        const intensity = isIdleGap ? burnoutIntensity(lastTileCompletionAt) : 1
        return (
          <div key={curse.enemyId} className={s.curseCard}>
            <div className={s.curseName}>☠ {def.name}</div>
            <div className={s.curseFlavor}>{def.flavor}</div>
            <div className={s.cursePenalty}>
              −{Math.round(def.penalty.damagePct * intensity * 100)}% dmg
              {' · −'}{Math.round(def.penalty.hpDrainPerTile * intensity)} HP/tile
            </div>
            <div className={s.curseProgress}>{renderProgress(curse, def, lastTileCompletionAt)}</div>
            <div className={s.curseStamina}>
              Stamina cushions this — {playerStamina}/{playerMaxStamina}
            </div>
          </div>
        )
      })}
    </div>
  )
}
