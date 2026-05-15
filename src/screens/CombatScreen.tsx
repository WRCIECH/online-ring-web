import { useReducer, useEffect, useCallback, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { combatReducer, initCombatState, STAGGER_PAUSE_MS } from '../engine/combat'
import { useGameStore } from '../store/gameStore'
import { ENEMIES } from '../data/enemies'
import { playSound } from '../engine/sound'
import { WEAPONS, getWeaponMovesets } from '../data/weapons'
import { MOVES } from '../data/movesets'
import EquipOverlay from '../components/overlays/EquipOverlay'
import StepPanel    from '../components/combat/StepPanel'
import DefensePanel from '../components/combat/DefensePanel'
import TimerOverlay from '../components/combat/TimerOverlay'
import EnemyDisplay from '../components/combat/EnemyDisplay'
import EnemyBars    from '../components/combat/EnemyBars'
import PlayerBars   from '../components/combat/PlayerBars'
import CombatLog    from '../components/combat/CombatLog'
import RadialMenu, { type RadialItem } from '../components/combat/RadialMenu'
import s from './CombatScreen.module.css'

// Pre-computed once — consistent splatter pattern every fight
const BLOOD_DROPS = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * Math.PI * 2 + (Math.random() * 0.5 - 0.25)
  const dist  = 38 + Math.floor(Math.random() * 82)
  return {
    tx:    Math.round(Math.cos(angle) * dist),
    ty:    Math.round(Math.sin(angle) * dist),
    w:     3 + Math.floor(Math.random() * 10),
    h:     3 + Math.floor(Math.random() * 10),
    delay: Math.floor(Math.random() * 200),
    hue:   Math.floor(350 + Math.random() * 16),
    light: Math.floor(16 + Math.random() * 22),
    dur:   650 + Math.floor(Math.random() * 380),
  }
})

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

  // ── Loot: compute drops once when VICTORY is entered ──────────────────
  interface LootItem { id: string; name: string; type: 'weapon' | 'moveset'; obtained: boolean }
  const [lootItems, setLootItems]       = useState<LootItem[] | null>(null)
  const [lootRevealed, setLootRevealed] = useState(false)
  const [bloodActive, setBloodActive]   = useState(false)

  useEffect(() => {
    if (state.phase !== 'VICTORY' || !loc || lootItems !== null) return
    const enemy = ENEMIES[loc.enemy_id]
    const defeatedBefore = store.run_defeated_enemies.includes(loc.enemy_id)
    setLootItems(enemy.drops.map(drop => ({
      id:       drop.id,
      name:     WEAPONS[drop.id]?.name ?? MOVES[drop.id]?.name ?? drop.id,
      type:     (WEAPONS[drop.id] ? 'weapon' : 'moveset') as 'weapon' | 'moveset',
      obtained: Math.random() < (defeatedBefore ? drop.repeat_chance : drop.first_kill_chance),
    })))
  }, [state.phase, loc, store.run_defeated_enemies, lootItems])

  function handleCorpseClick() {
    if (state.phase !== 'VICTORY' || lootRevealed || !lootItems) return
    setBloodActive(true)
    playSound('RUNE_GAIN')
    lootItems.forEach((item, i) => {
      if (item.obtained) setTimeout(() => playSound('LOOT_DROP'), i * 280 + 150)
    })
    setTimeout(() => setLootRevealed(true), 420)
  }

  // ── Victory handler ────────────────────────────────────────────────────
  const handleVictoryContinue = useCallback(() => {
    if (!loc || !lootItems) return
    store.syncCombatResult(state.playerHp, state.playerEstus)
    store.flushWeaponXp(state.weaponXpAccumulated)
    lootItems.forEach(item => {
      if (!item.obtained) return
      if (item.type === 'weapon') store.unlockWeapon(item.id)
      else store.unlockMoveset(item.id)
    })
    store.addDefeatedEnemy(loc.enemy_id)
    const enemy = ENEMIES[loc.enemy_id]
    const isLast = store.run_current_index >= store.run_location_sequence.length - 1
    store.advanceRun()
    if (isLast || enemy.is_remembrance) {
      store.endRunVictory()
      navigate('/run-complete')
    } else {
      store.setPendingEncounter(null)
      navigate('/map')
    }
  }, [loc, store, navigate, state.playerHp, state.playerEstus, state.weaponXpAccumulated, lootItems])

  // ── Defeat handler ─────────────────────────────────────────────────────
  const handleDefeat = useCallback(() => {
    store.syncCombatResult(state.playerHp, state.playerEstus)
    store.flushWeaponXp(state.weaponXpAccumulated)
    store.endRunFailure()
    navigate('/')
  }, [store, navigate, state.playerHp, state.playerEstus, state.weaponXpAccumulated])

  const [confirmEstus, setConfirmEstus] = useState(false)
  const [showEquip, setShowEquip]       = useState(false)

  // ── Radial action menu ────────────────────────────────────────────────
  const [radialPos, setRadialPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (state.phase !== 'PLAYER_ATTACK') setRadialPos(null)
  }, [state.phase])

  const radialItems = useMemo<RadialItem[]>(() => {
    if (!radialPos || state.phase !== 'PLAYER_ATTACK') return []
    const weaponId = state.equippedWeapons[state.activeWeaponIdx] ?? state.equippedWeapons[0]
    const weapon   = WEAPONS[weaponId]
    const extra    = state.weaponExtraMovesets[weaponId] ?? []
    const movesets = getWeaponMovesets(weaponId, extra)
    const N        = movesets.length
    const RADIUS   = 94

    return movesets.flatMap((moveset, i) => {
      const isMidChain = state.chainMovesetId === moveset.id
      const showIdx    = isMidChain ? state.chainStepIdx : 0
      const step       = moveset.steps[showIdx]
      if (!step) return []
      const canUse = state.playerStamina >= moveset.stamina_cost
      const dmg    = weapon
        ? Math.floor(step.base_damage * (1 + state.playerStats[moveset.scaling_stat] * 0.004))
        : step.base_damage
      const angle = (i / N) * 2 * Math.PI - Math.PI / 2
      return [{ moveset, step, stepIdx: showIdx, totalSteps: moveset.steps.length, canUse, dmg,
        tx: Math.cos(angle) * RADIUS,
        ty: Math.sin(angle) * RADIUS,
      }]
    })
  }, [radialPos, state])

  function handleDisplayClick(e: React.MouseEvent) {
    if (state.phase !== 'PLAYER_ATTACK') return
    setRadialPos({ x: e.clientX, y: e.clientY })
  }

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
          <div
            className={s.displayWrapper}
            onClick={handleDisplayClick}
            style={{ cursor: state.phase === 'PLAYER_ATTACK' ? 'crosshair' : 'default' }}
          >
            <div
              className={`${s.enemyArena} ${state.phase === 'VICTORY' ? s.arenaDefeated : ''}`}
              onClick={state.phase === 'VICTORY' && !lootRevealed ? handleCorpseClick : undefined}
            >
              <div className={s.enemyBarOverlay}>
                <EnemyBars
                  name={enemyData.name}
                  hp={state.enemyHp} maxHp={state.enemyMaxHp}
                  poise={state.enemyPoise} maxPoise={state.enemyMaxPoise}
                />
              </div>
              <EnemyDisplay enemyId={loc.enemy_id} hp={state.enemyHp} maxHp={state.enemyMaxHp} />
              {state.phase === 'VICTORY' && !lootRevealed && (
                <div className={s.corpsePrompt}>⚔ Examine corpse</div>
              )}
              {bloodActive && (
                <div className={s.bloodOverlay} aria-hidden="true">
                  {BLOOD_DROPS.map((d, i) => (
                    <span
                      key={i}
                      className={s.bloodDrop}
                      style={{
                        width:  d.w,
                        height: d.h,
                        animationDelay:    `${d.delay}ms`,
                        animationDuration: `${d.dur}ms`,
                        background: `hsl(${d.hue}, 85%, ${d.light}%)`,
                        '--tx': `${d.tx}px`,
                        '--ty': `${d.ty}px`,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
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

      {/* ── Radial action menu ────────────────────────────────────────── */}
      {radialPos && radialItems.length > 0 && (
        <RadialMenu
          x={radialPos.x}
          y={radialPos.y}
          items={radialItems}
          onSelect={(step, moveset) => {
            const weaponId = state.equippedWeapons[state.activeWeaponIdx] ?? state.equippedWeapons[0]
            dispatch({ type: 'STEP_CLICKED', step, moveset, weaponId })
          }}
          onClose={() => setRadialPos(null)}
        />
      )}

      {/* ── Victory / loot reveal ─────────────────────────────────────── */}
      {state.phase === 'VICTORY' && lootRevealed && lootItems && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={`${s.endTitle} ${s.victoryTitle}`}>Victory</div>
            <div className={s.lootEnemyName}>{enemyData.name} defeated</div>

            <div className={s.lootRunes}>✦ {enemyData.rune_reward} runes</div>

            {lootItems.some(item => item.obtained) && (
              <div className={s.lootSection}>
                {lootItems.filter(item => item.obtained).map((item, i) => (
                  <div
                    key={item.id}
                    className={`${s.lootItem} ${s.lootObtained}`}
                    style={{ animationDelay: `${i * 220}ms` }}
                  >
                    <span className={s.lootIcon}>✓</span>
                    <span className={s.lootName}>{item.name}</span>
                    <span className={s.lootType}>{item.type}</span>
                  </div>
                ))}
              </div>
            )}

            {Object.entries(state.weaponXpAccumulated).some(([, xp]) => xp > 0) && (
              <div className={s.xpSection}>
                {Object.entries(state.weaponXpAccumulated)
                  .filter(([, xp]) => xp > 0)
                  .map(([wid, xp], i) => (
                    <div key={wid} className={s.xpItem} style={{ animationDelay: `${(lootItems.length + i) * 220}ms` }}>
                      {WEAPONS[wid]?.name ?? wid} +{xp} XP
                    </div>
                  ))}
              </div>
            )}

            <button className={s.endBtn} onClick={handleVictoryContinue}>
              {enemyData.is_remembrance ? 'Run Complete' : 'Continue →'}
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
