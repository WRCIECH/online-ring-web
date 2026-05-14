import type { CombatState, CombatAction } from '../../engine/combat'
import { STA_ROLL, STA_BLOCK, STA_PARRY } from '../../engine/combat'
import { MOVES } from '../../data/movesets'
import { WEAPONS } from '../../data/weapons'
import s from './DefensePanel.module.css'

interface Props { state: CombatState; dispatch: React.Dispatch<CombatAction> }

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60), sc = secs % 60
  return m > 0 ? `${m}m ${sc}s` : `${sc}s`
}

export default function DefensePanel({ state, dispatch }: Props) {
  const { currentMove, playerStamina, enemyData, equippedWeapons } = state
  if (!currentMove) return null

  const guardBreak = playerStamina === 0
  const wid        = equippedWeapons[0]
  const weapon     = WEAPONS[wid]

  const dodge  = currentMove.dodge_task
  const parry  = currentMove.parry_task
  const blockMs = weapon ? MOVES[weapon.defense_movesets.block]?.steps[0] : null
  const parryMs = weapon ? MOVES[weapon.defense_movesets.parry]?.steps[0] : null

  function btn(
    title: string, subtitle: string,
    disabled: boolean,
    onClick: () => void,
    danger = false,
  ) {
    return (
      <button
        className={[s.defBtn, disabled ? s.disabled : '', danger ? s.danger : ''].join(' ')}
        disabled={disabled}
        onClick={onClick}
      >
        <div className={s.defTitle}>{title}</div>
        <div className={s.defSub}>{subtitle}</div>
      </button>
    )
  }

  return (
    <div className={s.root}>
      <div className={s.header}>DEFEND AGAINST</div>
      <div className={s.attackName}>{currentMove.name}</div>
      <div className={s.attackDesc}>{currentMove.description}</div>
      <hr />
      {guardBreak && <div className={s.guardBreak}>GUARD BREAK — no stamina</div>}

      <div className={s.list}>
        {btn(
          `Roll  ·  ${STA_ROLL} STA  →  0 dmg`,
          dodge ? `${dodge.name}  ·  ${fmtTime(dodge.time)}` : '???',
          guardBreak || playerStamina < STA_ROLL,
          () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'roll' }),
        )}
        {btn(
          `Block  ·  ${STA_BLOCK} STA  →  ${currentMove.block_damage} dmg`,
          blockMs ? `${blockMs.name}  ·  ${fmtTime(blockMs.time)}` : '???',
          guardBreak || playerStamina < STA_BLOCK || !blockMs,
          () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'block' }),
        )}
        {btn(
          `Parry  ·  ${STA_PARRY} STA  →  0 dmg`,
          (parry && parryMs)
            ? `1: ${parry.name} (${fmtTime(parry.time)}) → 2: ${parryMs.name} (${fmtTime(parryMs.time)})`
            : '???',
          guardBreak || playerStamina < STA_PARRY || !parry || !parryMs,
          () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'parry' }),
        )}
        <hr />
        {btn(
          `Take Hit  →  ${currentMove.damage} dmg`,
          'No task required',
          false,
          () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'take' }),
          true,
        )}
        {!enemyData.is_boss && btn(
          'Flee',
          'Ends the run',
          false,
          () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'flee' }),
          true,
        )}
      </div>
    </div>
  )
}
