import { useReducer, useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { combatReducer, initCombatState, STAGGER_PAUSE_MS, STA_ROLL, STA_BLOCK, STA_PARRY } from '../engine/combat'
import { useGameStore } from '../store/gameStore'
import { ENEMIES } from '../data/enemies'
import { playSound } from '../engine/sound'
import { WEAPONS, getWeaponMovesets } from '../data/weapons'
import { MOVES } from '../data/movesets'
import type { WeaponRarity, WeaponClass, WeaponInstance, GeneratedMoveset } from '../types/game'
import { rollWeapon } from '../data/generators/weaponGenerator'
import { rollMoveset } from '../data/generators/movesetGenerator'
import RunHeader from '../components/layout/RunHeader'
import TimerOverlay from '../components/combat/TimerOverlay'
import EnemyDisplay from '../components/combat/EnemyDisplay'
import EnemyBars    from '../components/combat/EnemyBars'
import CombatLog    from '../components/combat/CombatLog'
import QuickBar     from '../components/combat/QuickBar'
import RadialMenu, { type RadialItem } from '../components/combat/RadialMenu'
import s from './CombatScreen.module.css'

// Map legacy drop IDs → new generation instructions
const DROP_MAP: Record<string, { type: 'weapon' | 'moveset'; wclass: WeaponClass }> = {
  dagger:           { type: 'weapon',  wclass: 'daggers' },
  greatsword:       { type: 'weapon',  wclass: 'greatswords' },
  fast_publish:     { type: 'moveset', wclass: 'straight_swords' },
  single_thought:   { type: 'moveset', wclass: 'straight_swords' },
  raw_take:         { type: 'moveset', wclass: 'katanas' },
  immediate_strike: { type: 'moveset', wclass: 'daggers' },
  recovery_roll:    { type: 'moveset', wclass: 'fists' },
  endurance_strike: { type: 'moveset', wclass: 'greatswords' },
}

const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#aaaaaa', magic: '#4488cc', rare: '#ccaa22',
  epic: '#9944cc', legendary: '#ee8822',
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60), s = secs % 60
  return m > 0 ? (s > 0 ? `${m}m ${s}s` : `${m}m`) : `${s}s`
}

// Static SVG icons for non-moveset radial actions
const ICON_END_TURN = (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)
const ICON_TAKE_HIT = (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
const ICON_FLEE = (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

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
  interface LootItem {
    id: string; name: string; type: 'weapon' | 'moveset'; obtained: boolean
    rarity?: WeaponRarity
    generated?: WeaponInstance | GeneratedMoveset
  }
  const [lootItems, setLootItems]       = useState<LootItem[] | null>(null)
  const [lootRevealed, setLootRevealed] = useState(false)
  const [bloodActive, setBloodActive]   = useState(false)

  useEffect(() => {
    if (state.phase !== 'VICTORY' || !loc || lootItems !== null) return
    const enemy = ENEMIES[loc.enemy_id]
    const defeatedBefore = store.run_defeated_enemies.includes(loc.enemy_id)
    const subtype = loc.sublocation_type
    const minRarity: WeaponRarity =
      subtype === 'boss'  ? 'rare'   :
      subtype === 'elite' ? 'magic'  :
      subtype === 'event' ? 'rare'   : 'common'
    const items: LootItem[] = enemy.drops.map(drop => {
      const obtained = Math.random() < (defeatedBefore ? drop.repeat_chance : drop.first_kill_chance)
      const meta = DROP_MAP[drop.id] ?? { type: 'moveset' as const, wclass: 'straight_swords' as WeaponClass }
      if (!obtained) return { id: drop.id, name: drop.id, type: meta.type, obtained: false }
      if (meta.type === 'weapon') {
        const w = rollWeapon(meta.wclass, minRarity)
        return { id: w.instance_id, name: w.name, type: 'weapon', obtained: true, rarity: w.rarity, generated: w }
      } else {
        const m = rollMoveset(meta.wclass, minRarity)
        return { id: m.id, name: m.name, type: 'moveset', obtained: true, rarity: m.rarity, generated: m }
      }
    })
    setLootItems(items)
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
    store.applyWeaponHeat(state.weaponHeatAccumulated)
    // Flush moveset XP (time-based, persistent through failure)
    store.flushMovesetXp(state.movesetXpAccumulated)
    // Record weapon kill
    const activeWeaponId = state.equippedWeapons[state.activeWeaponIdx] ?? state.equippedWeapons[0]
    const enemy = ENEMIES[loc.enemy_id]
    store.recordWeaponKill(activeWeaponId, enemy.is_boss)
    // Apply generated drops
    lootItems.forEach(item => {
      if (!item.obtained || !item.generated) return
      if (item.type === 'weapon') store.addWeaponInstance(item.generated as WeaponInstance)
      else store.addMovesetInstance(item.generated as GeneratedMoveset)
    })
    store.addDefeatedEnemy(loc.enemy_id)
    const isLast = store.run_current_index >= store.run_location_sequence.length - 1
    store.advanceRun()
    if (isLast || enemy.is_remembrance) {
      store.endRunVictory()
      navigate('/run-complete')
    } else {
      store.setPendingEncounter(null)
      navigate('/map')
    }
  }, [loc, store, navigate, state.playerHp, state.playerEstus, state.movesetXpAccumulated,
      state.equippedWeapons, state.activeWeaponIdx, lootItems])

  // ── Defeat handler ─────────────────────────────────────────────────────
  const handleDefeat = useCallback(() => {
    store.syncCombatResult(state.playerHp, state.playerEstus)
    store.applyWeaponHeat(state.weaponHeatAccumulated)
    // Moveset XP persists through defeat (per spec)
    store.flushMovesetXp(state.movesetXpAccumulated)
    store.endRunFailure()
    navigate('/')
  }, [store, navigate, state.playerHp, state.playerEstus, state.movesetXpAccumulated])


  // ── Radial action menu ────────────────────────────────────────────────
  const mobSvgRef = useRef<SVGSVGElement>(null)
  const [radialPos, setRadialPos] = useState<{ x: number; y: number; rx: number; ry: number } | null>(null)

  useEffect(() => {
    if (state.phase !== 'PLAYER_ATTACK' && state.phase !== 'ENEMY_ATTACK') setRadialPos(null)
  }, [state.phase])

  const radialItems = useMemo<RadialItem[]>(() => {
    if (!radialPos) return []
    // Place icons at 78% of the oval's own radius — inside the bright arena ellipse
    const rx = radialPos.rx * 0.78
    const ry = radialPos.ry * 0.78

    // ── Attack phase: movesets + End Turn ──────────────────────────────
    if (state.phase === 'PLAYER_ATTACK') {
      const weaponId = state.equippedWeapons[state.activeWeaponIdx] ?? state.equippedWeapons[0]
      const weapon   = WEAPONS[weaponId]
      const extra    = state.weaponExtraMovesets[weaponId] ?? []
      const movesets = getWeaponMovesets(weaponId, extra)
      const N        = movesets.length + 1  // +1 for End Turn

      const attackItems: RadialItem[] = movesets.flatMap((moveset, i) => {
        const isMidChain = state.chainMovesetId === moveset.id
        const showIdx    = isMidChain ? state.chainStepIdx : 0
        const step       = moveset.steps[showIdx]
        if (!step) return []
        const canUse = state.playerStamina >= moveset.stamina_cost
        const disabledReason = canUse ? undefined
          : `Need ${moveset.stamina_cost} STA (have ${Math.floor(state.playerStamina)})`
        const dmg    = weapon
          ? Math.floor(step.base_damage * (1 + state.playerStats[moveset.scaling_stat] * 0.004))
          : step.base_damage
        const prefix = moveset.steps.length > 1 ? `[${showIdx + 1}/${moveset.steps.length}] ` : ''
        const angle  = (i / N) * 2 * Math.PI - Math.PI / 2
        return [{
          id: moveset.id, movesetId: moveset.id,
          label: moveset.name,
          sublabel: `${prefix}${step.name}`,
          metaParts: [
            { text: fmtTime(step.time) },
            { text: `${dmg} dmg`, color: '#cc6644' },
            { text: `${moveset.stamina_cost} STA`, color: 'var(--color-stamina)' },
          ],
          canUse, disabledReason, tx: Math.cos(angle) * rx, ty: Math.sin(angle) * ry,
          onSelect: () => dispatch({ type: 'STEP_CLICKED', step, moveset, weaponId }),
        }]
      })

      const endAngle = (movesets.length / N) * 2 * Math.PI - Math.PI / 2
      return [...attackItems, {
        id: 'end_turn', customIcon: ICON_END_TURN,
        label: 'End Turn', sublabel: 'Pass to enemy', metaParts: [],
        canUse: true,
        tx: Math.cos(endAngle) * rx, ty: Math.sin(endAngle) * ry,
        onSelect: () => dispatch({ type: 'END_TURN' }),
      }]
    }

    // ── Defense phase ─────────────────────────────────────────────────
    if (state.phase === 'ENEMY_ATTACK' && state.currentMove) {
      const move      = state.currentMove
      const guardBreak = state.playerStamina === 0
      const wid       = state.equippedWeapons[0]
      const weapon    = WEAPONS[wid]
      const dodge     = move.dodge_task
      const parryTask = move.parry_task
      const blockMs   = weapon ? MOVES[weapon.defense_movesets.block]?.steps[0] : null
      const parryMs   = weapon ? MOVES[weapon.defense_movesets.parry]?.steps[0] : null

      const sta = Math.floor(state.playerStamina)
      const opts: Omit<RadialItem, 'tx' | 'ty'>[] = [
        {
          id: 'roll', movesetId: 'recovery_roll',
          label: 'Roll',
          sublabel: dodge ? `${dodge.name} · ${fmtTime(dodge.time)}` : '???',
          metaParts: [{ text: `${STA_ROLL} STA` }, { text: '0 dmg', color: 'var(--color-text-success)' }],
          canUse: !guardBreak && state.playerStamina >= STA_ROLL,
          disabledReason: guardBreak ? 'Guard broken' : state.playerStamina < STA_ROLL ? `Need ${STA_ROLL} STA (have ${sta})` : undefined,
          onSelect: () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'roll' }),
        },
        {
          id: 'block', movesetId: 'unarmed_block',
          label: 'Block', sublabel: blockMs?.name,
          metaParts: [{ text: `${STA_BLOCK} STA` }, { text: `${move.block_damage} dmg`, color: '#cc6644' }],
          canUse: !guardBreak && state.playerStamina >= STA_BLOCK && !!blockMs,
          disabledReason: guardBreak ? 'Guard broken' : state.playerStamina < STA_BLOCK ? `Need ${STA_BLOCK} STA (have ${sta})` : !blockMs ? 'No block moveset' : undefined,
          onSelect: () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'block' }),
        },
        {
          id: 'parry', movesetId: 'unarmed_parry',
          label: 'Parry',
          sublabel: (parryTask && parryMs) ? `${parryTask.name} → ${parryMs.name}` : '???',
          metaParts: [{ text: `${STA_PARRY} STA` }, { text: '0 dmg', color: 'var(--color-text-success)' }],
          canUse: !guardBreak && state.playerStamina >= STA_PARRY && !!parryTask && !!parryMs,
          disabledReason: guardBreak ? 'Guard broken' : state.playerStamina < STA_PARRY ? `Need ${STA_PARRY} STA (have ${sta})` : (!parryTask || !parryMs) ? 'No parry moveset' : undefined,
          onSelect: () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'parry' }),
        },
        {
          id: 'take', customIcon: ICON_TAKE_HIT,
          label: 'Take Hit', sublabel: 'No task required',
          metaParts: [{ text: `${move.damage} dmg`, color: '#cc6644' }],
          canUse: true,
          onSelect: () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'take' }),
        },
        ...(!state.enemyData.is_boss ? [{
          id: 'flee', customIcon: ICON_FLEE,
          label: 'Flee', sublabel: 'Ends the run',
          metaParts: [] as RadialItem['metaParts'],
          canUse: true,
          onSelect: () => dispatch({ type: 'DEFENSE_CHOSEN', action: 'flee' }),
        }] : []),
      ]

      return opts.map((opt, i) => {
        const angle = (i / opts.length) * 2 * Math.PI - Math.PI / 2
        return { ...opt, tx: Math.cos(angle) * rx, ty: Math.sin(angle) * ry }
      })
    }

    return []
  }, [radialPos, state, dispatch])

  function handleDisplayClick() {
    if (state.phase !== 'PLAYER_ATTACK' && state.phase !== 'ENEMY_ATTACK') return
    const rect = mobSvgRef.current?.getBoundingClientRect()
    if (!rect) return
    setRadialPos({
      x:  rect.left + rect.width  / 2,
      y:  rect.top  + rect.height / 2,
      rx: rect.width  / 2,
      ry: rect.height / 2,
    })
  }

  if (!loc || !enemyData) return null

  return (
    <div className={s.root}>
      <RunHeader
        hp={state.playerHp}      maxHp={state.playerMaxHp}
        stamina={state.playerStamina} maxStamina={state.playerMaxStamina}
        fp={state.playerFp}      maxFp={state.playerMaxFp}
      />

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className={s.right}>
        <div className={s.enemyZone}>
          <div className={s.displayWrapper}>
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
              <EnemyDisplay
                enemyId={loc.enemy_id}
                hp={state.enemyHp}
                maxHp={state.enemyMaxHp}
                onClick={() => handleDisplayClick()}
                cursor={(state.phase === 'PLAYER_ATTACK' || state.phase === 'ENEMY_ATTACK') ? 'crosshair' : undefined}
                svgForwardRef={mobSvgRef}
                sublocationtype={loc.sublocation_type}
              />
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
          <QuickBar
            equippedWeapons={state.equippedWeapons}
            activeWeaponIdx={state.activeWeaponIdx}
            playerEstus={state.playerEstus}
            phase={state.phase}
            dispatch={dispatch}
          />
          <CombatLog entries={state.log} />
        </div>
      </div>


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
                    <span className={s.lootName} style={item.rarity ? { color: RARITY_COLOURS[item.rarity] } : undefined}>
                      {item.name}
                    </span>
                    <span className={s.lootType}>{item.rarity ? `${item.rarity} ${item.type}` : item.type}</span>
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
