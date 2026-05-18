import type { CombatState, CombatAction } from '../../engine/combat'
import { getActiveSteps } from '../../engine/combat'
import { getWeaponMovesets, WEAPONS } from '../../data/weapons'
import { useGameStore } from '../../store/gameStore'
import type { GeneratedMoveset } from '../../types/game'
import MovesetIcon from '../icons/MovesetIcon'
import s from './StepPanel.module.css'

interface Props {
  state: CombatState
  dispatch: React.Dispatch<CombatAction>
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60), sc = secs % 60
  return m > 0 ? `${m}m ${sc}s` : `${sc}s`
}

export default function StepPanel({ state, dispatch }: Props) {
  const { equippedWeapons, weaponExtraMovesets, activeWeaponIdx,
          chainMovesetId, chainStepIdx, playerStamina } = state
  const store = useGameStore()

  const weaponId  = equippedWeapons[activeWeaponIdx] ?? equippedWeapons[0]
  const weapon    = WEAPONS[weaponId]
  const extra     = weaponExtraMovesets[weaponId] ?? []
  const movesets  = getWeaponMovesets(weaponId, extra)

  return (
    <div className={s.root}>
      {/* Weapon tabs */}
      {equippedWeapons.length > 1 && (
        <div className={s.tabs}>
          {equippedWeapons.map((wid, i) => (
            <button
              key={wid}
              className={[s.tab, i === activeWeaponIdx ? s.tabActive : ''].join(' ')}
              onClick={() => dispatch({ type: 'SET_WEAPON', idx: i })}
            >
              {WEAPONS[wid]?.name ?? wid}
            </button>
          ))}
        </div>
      )}

      <div className={s.header}>ACTIONS</div>

      <div className={s.list}>
        {movesets.map(moveset => {
          const msLevel = store.moveset_level[moveset.id] ?? 1
          // Use active steps filtered by moveset level
          const activeSteps = getActiveSteps(moveset as GeneratedMoveset, msLevel)
          const isMidChain = chainMovesetId === moveset.id && moveset.id !== ''
          const showIdx    = isMidChain ? Math.min(chainStepIdx, activeSteps.length - 1) : 0
          const step       = activeSteps[showIdx]
          if (!step) return null

          const canUse  = playerStamina >= moveset.stamina_cost
          const dmg     = weapon
            ? Math.floor(step.base_damage * (1 + state.playerStats[moveset.scaling_stat] * 0.004))
            : step.base_damage
          const prefix  = activeSteps.length > 1
            ? `[${showIdx + 1}/${activeSteps.length}] ` : ''

          return (
            <div key={moveset.id} className={s.movesetGroup}>
              <div className={s.movesetName}>
                <MovesetIcon movesetId={moveset.id} size={13} />
                {moveset.name}
                {msLevel > 1 && <span className={s.msLevel}>Lvl {msLevel}</span>}
              </div>
              <button
                className={[s.stepBtn, !canUse ? s.disabled : '', isMidChain ? s.inChain : ''].join(' ')}
                disabled={!canUse}
                onClick={() => dispatch({ type: 'STEP_CLICKED', step, moveset, weaponId })}
              >
                <div className={s.stepTitle}>{prefix}{step.name}</div>
                <div className={s.stepMeta}>
                  <span>{fmtTime(step.time)}</span>
                  <span className={s.dmg}>{dmg} dmg</span>
                  <span className={s.sta}>{moveset.stamina_cost} STA</span>
                </div>
              </button>
            </div>
          )
        })}

        <hr />
        <button className={s.endTurnBtn} onClick={() => dispatch({ type: 'END_TURN' })}>
          End Turn
        </button>
      </div>
    </div>
  )
}
