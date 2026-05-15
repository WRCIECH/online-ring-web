import { useReducer, useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { combatReducer, initCombatState, STAGGER_PAUSE_MS } from '../engine/combat'
import { useGameStore } from '../store/gameStore'
import { ENEMIES } from '../data/enemies'
import { playSound } from '../engine/sound'
import { WEAPONS } from '../data/weapons'
import EquipOverlay from '../components/overlays/EquipOverlay'
import StepPanel    from '../components/combat/StepPanel'
import DefensePanel from '../components/combat/DefensePanel'
import TimerOverlay from '../components/combat/TimerOverlay'
import EnemyDisplay from '../components/combat/EnemyDisplay'
import EnemyBars    from '../components/combat/EnemyBars'
import PlayerBars   from '../components/combat/PlayerBars'
import CombatLog    from '../components/combat/CombatLog'
import s from './CombatScreen.module.css'

export default function CombatScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const loc      = store.pending_encounter

  // Guard: no pending encounter → back to map
  useEffect(() => {
    if (!loc) navigate('/map')
  }, [loc, navigate])

  const enemyData = loc ? ENEMIES[loc.enemy_id] : null
  const [state, dispatch] = useReducer(
    combatReducer,
    undefined,
    () => enemyData && loc
      ? initCombatState(
          loc.enemy_id, enemyData, loc.mult,
          store.equipped_run_weapons,
          store.weapon_extra_movesets,
          store.stats,
          store.current_hp,  store.maxHp(),
          store.current_stamina, store.maxStamina(),
          store.current_fp,  store.maxFp(),
          store.run_estus_count,
        )
      : initCombatState(
          'procrastination_mob', ENEMIES['procrastination_mob'], 1,
          ['unarmed'], {}, { VIG:10,END:10,MIND:10 },
          300,300, 130,130, 140,140, 3,
        )
  )

  // ── Side effects on phase change ───────────────────────────────────────
  useEffect(() => {
    switch (state.phase) {
      case 'ENEMY_STAGGERED':
        playSound('STAGGER')
        setTimeout(() => dispatch({ type: 'ENTER_PHASE', phase: 'PLAYER_ATTACK' }), STAGGER_PAUSE_MS)
        break
      case 'VICTORY':
        playSound('VICTORY')
        break
      case 'DEFEAT':
        playSound('DEFEAT')
        break
    }
  }, [state.phase])

  // Sound on hit
  const lastLogLen = state.log.length
  useEffect(() => {
    const last = state.log[state.log.length - 1]
    if (!last) return
    if (last.text.includes('damage!') && last.color === '#ffffff') playSound('HIT')
    if (last.text.includes('roll away'))  playSound('ROLL')
    if (last.text.includes('block'))      playSound('BLOCK')
    if (last.text.includes('parry'))      playSound('PARRY')
  }, [lastLogLen])

  // Timer expired → play alert
  useEffect(() => {
    if (state.timerExpired) playSound('TIMER_DONE')
  }, [state.timerExpired])

  // ── Victory handler ────────────────────────────────────────────────────
  const handleVictoryContinue = useCallback(() => {
    if (!loc) return
    store.syncCombatResult(state.playerHp, state.playerEstus)
    store.flushWeaponXp(state.weaponXpAccumulated)
    const enemy = ENEMIES[loc.enemy_id]
    const defeatedBefore = store.run_defeated_enemies.includes(loc.enemy_id)
    enemy.drops.forEach(drop => {
      const chance = defeatedBefore ? drop.repeat_chance : drop.first_kill_chance
      if (Math.random() < chance) {
        if (WEAPONS[drop.id]) store.unlockWeapon(drop.id)
        else store.unlockMoveset(drop.id)
        playSound('LOOT_DROP')
      }
    })
    store.addDefeatedEnemy(loc.enemy_id)
    // Check before advancing whether this is the last location
    const isLast = store.run_current_index >= store.run_location_sequence.length - 1
    store.advanceRun()
    if (isLast || enemy.is_remembrance) {
      store.endRunVictory()
      navigate('/run-complete')
    } else {
      store.setPendingEncounter(null)
      navigate('/map')
    }
  }, [loc, store, navigate, state.playerHp, state.playerEstus, state.weaponXpAccumulated])

  // ── Defeat handler ─────────────────────────────────────────────────────
  const handleDefeat = useCallback(() => {
    store.syncCombatResult(state.playerHp, state.playerEstus)
    store.flushWeaponXp(state.weaponXpAccumulated)
    store.endRunFailure()
    navigate('/')
  }, [store, navigate, state.playerHp, state.playerEstus, state.weaponXpAccumulated])

  const [confirmEstus, setConfirmEstus] = useState(false)
  const [showEquip, setShowEquip]       = useState(false)

  if (!loc || !enemyData) return null

  return (
    <div className={s.root}>
      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div className={s.leftPanel}>
        {/* Player stats — upper left */}
        <div className={s.playerBarsSection}>
          <PlayerBars
            hp={state.playerHp} maxHp={state.playerMaxHp}
            stamina={state.playerStamina} maxStamina={state.playerMaxStamina}
            fp={state.playerFp} maxFp={state.playerMaxFp}
            estus={state.playerEstus}
          />
        </div>

        {/* Action panels */}
        <div className={s.actionArea}>
          {state.phase === 'PLAYER_ATTACK' && (
            <StepPanel state={state} dispatch={dispatch} />
          )}
          {state.phase === 'ENEMY_ATTACK' && (
            <DefensePanel state={state} dispatch={dispatch} />
          )}
          {state.phase === 'ENEMY_STAGGERED' && (
            <div style={{ padding: 20, color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
              Enemy is staggered…
            </div>
          )}
        </div>

        {/* Equipment button */}
        <div className={s.equipArea}>
          <button className={s.equipBtn} onClick={() => setShowEquip(true)}>⚙ Equipment</button>
        </div>

        {/* Estus button */}
        {(state.phase === 'PLAYER_ATTACK' || state.phase === 'ENEMY_ATTACK') && (
          <div className={s.estusArea}>
            {confirmEstus ? (
              <>
                <span className={s.estusConfirmLabel}>Drink estus? (heals 40% HP)</span>
                <div className={s.estusConfirmBtns}>
                  <button className={s.estusYes} onClick={() => {
                    dispatch({ type: 'USE_ESTUS' })
                    setConfirmEstus(false)
                  }}>Yes</button>
                  <button onClick={() => setConfirmEstus(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <button
                className={s.estusBtn}
                disabled={state.playerEstus <= 0}
                onClick={() => setConfirmEstus(true)}
              >
                🧪 Drink Estus ({state.playerEstus})
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Right area ───────────────────────────────────────────────── */}
      <div className={s.right}>
        <div className={s.enemyZone}>
          {/* Display wrapper: enemy art fills space, name+HP floats above it */}
          <div className={s.displayWrapper}>
            <EnemyDisplay enemyId={loc.enemy_id} hp={state.enemyHp} maxHp={state.enemyMaxHp} />
            <div className={s.enemyBarOverlay}>
              <EnemyBars
                name={enemyData.name}
                hp={state.enemyHp} maxHp={state.enemyMaxHp}
                poise={state.enemyPoise} maxPoise={state.enemyMaxPoise}
              />
            </div>
          </div>
          {state.currentMove && state.phase === 'ENEMY_ATTACK' && (
            <div className={s.moveLabel}>
              {state.currentMove.name} — {state.currentMove.description}
            </div>
          )}
        </div>

        <div className={s.bottomZone}>
          <CombatLog entries={state.log} />
        </div>
      </div>

      {/* ── Equip overlay ────────────────────────────────────────────── */}
      {showEquip && <EquipOverlay onClose={() => setShowEquip(false)} />}

      {/* ── Timer overlay ────────────────────────────────────────────── */}
      {state.phase === 'STEP_TIMER' && (
        <TimerOverlay state={state} dispatch={dispatch} />
      )}

      {/* ── Stagger banner ────────────────────────────────────────────── */}
      {state.phase === 'ENEMY_STAGGERED' && (
        <div className={s.staggerBanner}>STAGGERED!</div>
      )}

      {/* ── Victory overlay ───────────────────────────────────────────── */}
      {state.phase === 'VICTORY' && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={`${s.endTitle} ${s.victoryTitle}`}>Victory</div>
            <div className={s.endSub}>
              {enemyData.name} has been defeated.<br/>
              {enemyData.rune_reward} runes earned.
            </div>
            <button className={s.endBtn} onClick={handleVictoryContinue}>
              {enemyData.is_remembrance ? 'Run Complete' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* ── Defeat overlay ────────────────────────────────────────────── */}
      {state.phase === 'DEFEAT' && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={`${s.endTitle} ${s.defeatTitle}`}>Defeated</div>
            <div className={s.endSub}>
              You have been overcome.<br/>The run ends here.
            </div>
            <button className={s.endBtn} onClick={handleDefeat}>Return</button>
          </div>
        </div>
      )}
    </div>
  )
}
