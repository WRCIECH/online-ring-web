import type { CombatState, CombatAction } from '../../engine/combat'
import { STA_BLOCK, STA_DEFENSE_GAIN } from '../../engine/combat'
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

  const guardBreak = false // guard break removed — all actions have individual STA checks
  const wid        = equippedWeapons[0]
  const weapon     = WEAPONS[wid]

  const dodge  = currentMove.dodge_task
  const publish = currentMove.publish_task
  const blockMs  = weapon ? MOVES[weapon.defense_movesets.block]?.steps[0] : null

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
          `Roll  →  +${STA_DEFENSE_GAIN} STA, 0 dmg`,
          dodge ? `${dodge.name}  ·  ${fmtTime(dodge.time)}` : '???',
          false,
          () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'roll' }),
        )}
        {btn(
          `Block  ·  −${STA_BLOCK} STA  →  0 dmg (instant)`,
          'No task required',
          playerStamina < STA_BLOCK || !blockMs,
          () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'block' }),
        )}
        {btn(
          `Parry  →  Full STA on success`,
          publish ? publish.name : '???',
          !publish,
          () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'parry' }),
        )}
        <hr />
        {btn(
          `Take Hit  →  ${currentMove.damage} dmg, +${STA_DEFENSE_GAIN} STA`,
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
