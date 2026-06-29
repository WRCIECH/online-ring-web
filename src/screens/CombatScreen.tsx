import { useReducer, useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { combatReducer, initCombatState, getReachableTiles, previewMove, formatMultiplierPct, ABANDON_PENALTY } from '../engine/combat'
import { useGameStore } from '../store/gameStore'
import { ENEMIES } from '../data/enemies'
import { WEAPONS } from '../data/weapons'
import { playSound } from '../engine/sound'
import type { WeaponInstance, WeaponRarity, MoveType, WorkflowGraph } from '../types/game'
import { rollWeapon } from '../data/generators/weaponGenerator'
import { generateWorkflow } from '../data/generators/workflowGenerator'
import RunHeader    from '../components/layout/RunHeader'
import TimerOverlay from '../components/combat/TimerOverlay'
import CombatLog    from '../components/combat/CombatLog'
import WorkflowCanvas from '../components/combat/WorkflowCanvas'
import MoveRadialMenu, { type RadialMoveItem } from '../components/combat/MoveRadialMenu'
import CombatBottomBar from '../components/combat/CombatBottomBar'
import CombatMusic  from '../components/combat/CombatMusic'
import { COMBAT_MUSIC } from '../data/combatMusic'
import { useT } from '../i18n'
import s from './CombatScreen.module.css'

const MOVE_DEFS: Array<{ move: MoveType; label: string; desc: string; colorVar: string }> = [
  { move: 'Light', label: 'Light', desc: 'Less time',                  colorVar: '#88aadd' },
  { move: 'Heavy', label: 'Heavy', desc: 'More time, bonus for it',    colorVar: '#dd9977' },
]
const RADIAL_RADIUS = 86

function fmtMoveTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const sc = secs % 60
  return m > 0 ? (sc > 0 ? `${m}m ${sc}s` : `${m}m`) : `${sc}s`
}

const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#aaaaaa', Intellectual: '#4488cc', rare: '#ccaa22',
  epic: '#9944cc', legendary: '#ee8822',
}


export default function CombatScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const t        = useT()
  const loc      = store.pending_encounter

  useEffect(() => { if (!loc) navigate('/map') }, [loc, navigate])

  const enemyData = loc ? ENEMIES[loc.enemy_id] : null

  // ── Weapons available in combat: all that have content attached ──────────
  const weaponsWithContent = store.weapon_instances.filter(w =>
    store.content_items.some(c => !c.completed && c.attached_weapon_id === w.instance_id)
  )

  // ── Initial weapon (seeds the very first/resumed workflow only) ──────────
  const initialWeaponId    = weaponsWithContent[0]?.instance_id ?? store.weapon_instances[0]?.instance_id ?? 'unarmed'
  const initialWeapon      = WEAPONS[initialWeaponId] as WeaponInstance | undefined
  const initialWeaponLevel = store.weapon_level[initialWeaponId] ?? 0
  const initialWeaponClass  = initialWeapon?.weapon_class ?? 'straight_swords'
  const initialWeaponRarity = initialWeapon?.rarity        ?? 'common'

  // ── Remaster pass — true if the content being worked on is mid-remaster ──
  const isRemasterPass = !!store.active_content_id
    && !!store.content_items.find(c => c.id === store.active_content_id)?.is_remastering

  // ── Init combat state (stable across renders) ────────────────────────────
  const [state, dispatch] = useReducer(
    combatReducer,
    undefined,
    () => {
      if (!enemyData || !loc) {
        const fallbackWorkflow = generateWorkflow('straight_swords', 'common', false)
        return initCombatState(
          fallbackWorkflow,
          ENEMIES['procrastination_mob'], 'procrastination_mob',
          'unarmed', 0,
          300, 300, 3,
          { VIG: 10, END: 10, TEXT: 8, VIDEO: 8, AUDIO: 8, GRAPHIC: 8, VELOCITY: 8, DEPTH: 8, PARASOCIAL: 8, FRICTION: 8, INSIGHT: 8 },
          0,
        )
      }
      // Resume persisted workflow or generate fresh
      const spawnAsBoss = loc.sublocation_type === 'boss'
      const workflow = store.active_workflow ?? generateWorkflow(initialWeaponClass, initialWeaponRarity, spawnAsBoss, initialWeapon?.rolled_draws)

      return initCombatState(
        workflow, enemyData, loc.enemy_id,
        initialWeaponId, initialWeaponLevel,
        store.current_hp, store.maxHp(),
        store.run_estus_count,
        store.stats,
        store.abandon_penalty,
        isRemasterPass,
        spawnAsBoss,
        loc.locationTheme,
      )
    }
  )

  // ── Live active weapon (can change mid-fight via SWITCH_WEAPON) ──────────
  const weapon  = WEAPONS[state.equippedWeaponId] as WeaponInstance | undefined
  const wClass  = weapon?.weapon_class ?? initialWeaponClass
  const wRarity = weapon?.rarity       ?? initialWeaponRarity

  // Per-weapon workflow cache: preserves progress when the player switches away and back
  const weaponWorkflows = useRef<Record<string, WorkflowGraph>>({
    [initialWeaponId]: state.workflow,
  })
  // Keep the cache current as tiles are completed for the active weapon
  const stateRef = useRef(state)
  stateRef.current = state

  const handleSwitchWeapon = useCallback((weaponId: string, weaponLevel: number) => {
    const cur = stateRef.current
    if (weaponId === cur.equippedWeaponId) return

    // Save current weapon's in-progress workflow before leaving
    weaponWorkflows.current[cur.equippedWeaponId] = cur.workflow

    dispatch({ type: 'SWITCH_WEAPON', weaponId, weaponLevel })

    // Restore saved workflow or generate a fresh one for a weapon seen for the first time
    const saved = weaponWorkflows.current[weaponId]
    if (saved) {
      dispatch({ type: 'SWITCH_WORKFLOW', workflow: saved, isRemaster: false })
    } else {
      const newWeapon   = WEAPONS[weaponId] as WeaponInstance | undefined
      const newClass    = newWeapon?.weapon_class ?? 'straight_swords'
      const newRarity   = newWeapon?.rarity       ?? 'common'
      const isBoss      = loc?.sublocation_type === 'boss'
      const newWorkflow = generateWorkflow(newClass, newRarity, isBoss, newWeapon?.rolled_draws)
      weaponWorkflows.current[weaponId] = newWorkflow
      dispatch({ type: 'SWITCH_WORKFLOW', workflow: newWorkflow, isRemaster: false })
    }

    // Switch active content to whichever item is attached to the new weapon
    const contentForWeapon = store.content_items.find(
      c => !c.completed && c.attached_weapon_id === weaponId
    )
    if (contentForWeapon) {
      setSelectedContentId(contentForWeapon.id)
      store.setActiveContentId(contentForWeapon.id)
    }
  }, [loc, store])

  // ── Sound effects on phase change ─────────────────────────────────────────
  useEffect(() => {
    if (state.phase === 'VICTORY') playSound('VICTORY')
    if (state.phase === 'DEFEAT')  playSound('DEFEAT')
    if (state.phase === 'FLED')    playSound('DEFEAT')
  }, [state.phase])

  useEffect(() => {
    if (state.timerExpired) playSound('TIMER_DONE')
  }, [state.timerExpired])

  // Log sound cues
  const lastLogLen = state.log.length
  useEffect(() => {
    const last = state.log[state.log.length - 1]
    if (!last) return
    if (last.color === '#55cc77') playSound('STAGGER')
    if (last.color === '#c9a93a' && last.text.startsWith('✓')) playSound('HIT')
  }, [lastLogLen])

  // ── Loot (computed once when VICTORY) ────────────────────────────────────
  interface LootItem { name: string; rarity: WeaponRarity; instance: WeaponInstance }
  const [lootItems, setLootItems] = useState<LootItem[] | null>(null)

  useEffect(() => {
    if (state.phase !== 'VICTORY' || !loc || lootItems !== null) return
    const enemy        = ENEMIES[loc.enemy_id]
    const defeatedBefore = store.run_defeated_enemies.includes(loc.enemy_id)
    const sub          = loc.sublocation_type
    const minRarity: WeaponRarity =
      sub === 'boss' || sub === 'event' ? 'rare' :
      sub === 'elite'                   ? 'Intellectual' : 'common'

    const items: LootItem[] = []
    for (const drop of enemy.drops) {
      const chance = defeatedBefore ? drop.repeat_chance : drop.first_kill_chance
      if (Math.random() < chance) {
        const w = rollWeapon(undefined, minRarity)
        items.push({ name: w.name, rarity: w.rarity, instance: w })
      }
    }
    setLootItems(items)
    playSound('RUNE_GAIN')
    items.forEach((_, i) => setTimeout(() => playSound('LOOT_DROP'), i * 280 + 150))
  }, [state.phase, loc, lootItems, store.run_defeated_enemies])

  // ── Victory ───────────────────────────────────────────────────────────────
  const handleVictoryContinue = useCallback(() => {
    if (!loc) return
    store.syncCombatResult(state.playerHp, state.playerEstus)
    store.addRunes(state.runesEarned)
    store.clearAbandonPenalty()
    lootItems?.forEach(item => store.addWeaponInstance(item.instance))
    store.addDefeatedEnemy(loc.enemy_id)
    // Persist or clear workflow
    const allDone = state.workflow.tiles.every(t => t.is_completed)
    if (allDone) {
      if (store.active_content_id) {
        const remastered = store.content_items.find(c => c.id === store.active_content_id)?.is_remastering
        store.updateContentItem(store.active_content_id, remastered
          ? { completed: true, is_remastering: false, remaster_count: (store.content_items.find(c => c.id === store.active_content_id)?.remaster_count ?? 0) + 1, last_workflow: state.workflow }
          : { completed: true, last_workflow: state.workflow })
      }
      store.clearActiveWorkflow()
    } else {
      store.saveWorkflowProgress(state.workflow)
    }
    const isLast = store.run_current_index >= store.run_location_sequence.length - 1
    store.advanceRun()
    if (isLast) { store.endRunVictory(); navigate('/run-complete') }
    else        { store.setPendingEncounter(null); navigate('/map') }
  }, [loc, store, navigate, state, lootItems, enemyData])

  // ── Defeat ────────────────────────────────────────────────────────────────
  const handleDefeat = useCallback(() => {
    store.syncCombatResult(state.playerHp, state.playerEstus)
    store.dropRunes(store.run_location_name, store.run_current_index)
    store.endRunFailure()
    navigate('/')
  }, [store, navigate, state])

  // ── Abandon (flee) ────────────────────────────────────────────────────────
  const handleFlee = useCallback(() => {
    store.syncCombatResult(state.playerHp, state.playerEstus)
    store.setAbandonPenalty(ABANDON_PENALTY)
    store.clearActiveWorkflow()
    store.endRunFailure()
    navigate('/')
  }, [store, navigate, state])

  const [musicMuted, setMusicMuted] = useState(false)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  // If a content item was already locked in the store, skip the picker entirely
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    store.active_content_id ?? null
  )

  const activeContent = store.content_items.filter(c => !c.completed)
  const selectedContent = activeContent.find(c => c.id === selectedContentId) ?? null

  const handleSelectContent = (id: string) => {
    setSelectedContentId(id)
    store.setActiveContentId(id)
    const item = store.content_items.find(c => c.id === id)
    if (item && !item.attached_weapon_id) {
      store.attachContentToWeapon(id, state.equippedWeaponId)
    }
  }

  // ── Workflow exhausted mid-fight: all tiles done, enemy still alive ──────
  const workflowExhausted = state.phase === 'PLAYER_TURN' && state.workflow.tiles.every(t => t.is_completed)
  const otherActiveContent = activeContent.filter(c => c.id !== selectedContentId)
  const [dismissedForWorkflow, setDismissedForWorkflow] = useState<string | null>(null)

  const handleSwitchContent = (id: string) => {
    if (selectedContentId) store.updateContentItem(selectedContentId, { completed: true })
    setSelectedContentId(id)
    store.setActiveContentId(id)
    const item = store.content_items.find(c => c.id === id)
    if (item && !item.attached_weapon_id) {
      store.attachContentToWeapon(id, state.equippedWeaponId)
    }
    const newWorkflow = generateWorkflow(wClass, wRarity, loc?.sublocation_type === 'boss', weapon?.rolled_draws)
    dispatch({ type: 'SWITCH_WORKFLOW', workflow: newWorkflow, isRemaster: false })
  }

  const handleContinueContent = () => {
    const newWorkflow = generateWorkflow(wClass, wRarity, loc?.sublocation_type === 'boss', weapon?.rolled_draws)
    dispatch({ type: 'SWITCH_WORKFLOW', workflow: newWorkflow, isRemaster: false })
  }

  // ── Selected tile (derived) ───────────────────────────────────────────────
  const selectedTile = state.selectedTileId
    ? state.workflow.tiles.find(t => t.id === state.selectedTileId) ?? null
    : null

  // ── Move radial menu (click a tile → circles to pick Light/Heavy) ────────
  const isPlayerTurn = state.phase === 'PLAYER_TURN'
  const [radialPos, setRadialPos] = useState<{ x: number; y: number } | null>(null)
  const reachableTiles = useMemo(() => getReachableTiles(state.workflow), [state.workflow])

  const handleTileClick = useCallback((tileId: string, x: number, y: number) => {
    if (!isPlayerTurn) return
    const tile = state.workflow.tiles.find(t => t.id === tileId)
    if (!tile) return
    if (!tile.is_completed && !reachableTiles.has(tileId)) return
    dispatch({ type: 'SELECT_TILE', tileId })
    setRadialPos({ x, y })
  }, [isPlayerTurn, state.workflow, reachableTiles])

  const radialItems = useMemo<RadialMoveItem[]>(() => {
    if (!radialPos || !selectedTile) return []
    const N = MOVE_DEFS.length
    return MOVE_DEFS.map((def, i) => {
      const angle   = Math.PI - (i / N) * 2 * Math.PI
      const preview = previewMove(state, selectedTile, def.move)
      return {
        id: def.move,
        label: def.label,
        sublabel: `${fmtMoveTime(preview.duration)} · ${def.desc}`,
        metaParts: [
          { text: `⚔ ${preview.damage}`, color: '#cc6644' },
          ...preview.multipliers.filter(m => m.active).map(m => ({
            text: `${t.ui[`mult_${m.key}`] ?? m.key} ${formatMultiplierPct(m.value)}`,
          })),
        ],
        colorVar: def.colorVar,
        tx: Math.cos(angle) * RADIAL_RADIUS,
        ty: Math.sin(angle) * RADIAL_RADIUS,
        onSelect: () => dispatch({ type: 'CHOOSE_MOVE', move: def.move }),
      }
    })
  }, [radialPos, selectedTile, state, t])

  if (!loc || !enemyData) return null

  const enemyLabel = loc.boss_name ?? enemyData.name

  return (
    <div className={s.root}>
      <RunHeader
        hp={state.playerHp} maxHp={state.playerMaxHp}
        canAddContent={state.phase !== 'STEP_TIMER'}
      />

      {selectedContent && (
        <div className={s.contentBar}>
          <span className={s.contentBarLabel}>Working on:</span>
          <span className={s.contentBarTitle}>{selectedContent.name}</span>
        </div>
      )}

      <div className={s.main}>
        <div className={s.canvasWrap}>
          <WorkflowCanvas
            workflow={state.workflow}
            selectedTileId={state.selectedTileId}
            onSelectTile={handleTileClick}
            enemy={{
              enemyId: loc.enemy_id,
              name: enemyLabel,
              description: enemyData.description,
              hp: state.phase === 'VICTORY' || state.phase === 'DEFEAT' || state.phase === 'FLED' ? 0 : state.enemyHp,
              maxHp: state.enemyMaxHp,
              isBoss: state.isBoss,
              sublocationtype: loc.sublocation_type,
            }}
          />
          {isPlayerTurn && radialPos && radialItems.length > 0 && (
            <MoveRadialMenu
              x={radialPos.x}
              y={radialPos.y}
              items={radialItems}
              onClose={() => setRadialPos(null)}
            />
          )}
        </div>
      </div>

      <div className={s.logWrap}>
        <CombatLog entries={state.log} />
      </div>

      <CombatBottomBar
        equippedWeaponIds={weaponsWithContent.map(w => w.instance_id)}
        activeWeaponId={state.equippedWeaponId}
        weaponLevels={store.weapon_level}
        playerEstus={state.playerEstus}
        canAct={isPlayerTurn}
        onSwitchWeapon={handleSwitchWeapon}
        onEstus={() => dispatch({ type: 'USE_ESTUS' })}
        onAbandon={() => setShowAbandonConfirm(true)}
      />

      {/* ── Content selection overlay ──────────────────────────────────── */}
      {selectedContentId === null && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={s.endTitle} style={{ fontSize: '1.3rem', color: 'var(--color-gold)' }}>
              What are you working on?
            </div>
            {activeContent.length === 0 ? (
              <>
                <div className={s.endSub}>
                  No active content items. Go to the Content panel and add a piece to work on before fighting.
                </div>
                <button className={s.endBtn} onClick={() => navigate('/map')}>
                  ← Back to map
                </button>
              </>
            ) : (
              <>
                <div className={s.endSub}>Pick the piece of content you're tackling in this session.</div>
                <div className={s.contentPickList}>
                  {activeContent.map(item => (
                    <button
                      key={item.id}
                      className={s.contentPickItem}
                      onClick={() => handleSelectContent(item.id)}
                    >
                      <span className={s.contentPickName}>{item.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Workflow exhausted, enemy still alive: pick the next piece ──── */}
      {selectedContentId !== null && workflowExhausted && dismissedForWorkflow !== state.workflow.start_id && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={s.endTitle} style={{ fontSize: '1.3rem', color: 'var(--color-gold)' }}>
              That piece is finished — {enemyLabel} is still standing
            </div>
            <div className={s.endSub}>
              {otherActiveContent.length === 0
                ? 'Move this piece into its next phase, keep repeating tiles, or add a new piece from the Content panel.'
                : 'Move this piece into its next phase, switch to another active piece, or keep repeating tiles.'}
            </div>
            <button className={s.endBtn} onClick={handleContinueContent}>
              Continue "{selectedContent?.name}" — next phase
            </button>
            {otherActiveContent.length > 0 && (
              <div className={s.contentPickList}>
                {otherActiveContent.map(item => (
                  <button
                    key={item.id}
                    className={s.contentPickItem}
                    onClick={() => handleSwitchContent(item.id)}
                  >
                    <span className={s.contentPickName}>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
            <button className={s.endBtn} onClick={() => setDismissedForWorkflow(state.workflow.start_id)}>
              Keep repeating tiles instead
            </button>
          </div>
        </div>
      )}

      {/* ── Timer overlay ──────────────────────────────────────────────── */}
      {state.phase === 'STEP_TIMER' && (
        <TimerOverlay state={state} dispatch={dispatch} contentName={selectedContent?.name} />
      )}

      {/* ── Victory overlay ────────────────────────────────────────────── */}
      {state.phase === 'VICTORY' && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={`${s.endTitle} ${s.victoryTitle}`}>Workflow Cleansed</div>
            <div className={s.lootEnemyName}>{enemyLabel} vanquished</div>

            <div className={s.lootRunes}>✦ {state.runesEarned} runes earned</div>

            {lootItems && lootItems.length > 0 && (
              <div className={s.lootSection}>
                {lootItems.map((item, i) => (
                  <div key={i} className={s.lootItem} style={{ animationDelay: `${i * 220}ms` }}>
                    <span className={s.lootIcon}>✓</span>
                    <span className={s.lootName} style={{ color: RARITY_COLOURS[item.rarity] }}>
                      {item.name}
                    </span>
                    <span className={s.lootType}>{item.rarity} workflow</span>
                  </div>
                ))}
              </div>
            )}

            <button className={s.endBtn} onClick={handleVictoryContinue}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Defeat overlay ─────────────────────────────────────────────── */}
      {state.phase === 'DEFEAT' && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={`${s.endTitle} ${s.defeatTitle}`}>Defeated</div>
            <div className={s.endSub}>
              The corruption overwhelmed you.<br />
              {store.runes > 0 ? `✦ ${store.runes} runes dropped here.` : 'Your run ends.'}
            </div>
            <button className={s.endBtn} onClick={handleDefeat}>Return</button>
          </div>
        </div>
      )}

      {/* ── Music ─────────────────────────────────────────────────────── */}
      <CombatMusic
        videoId={COMBAT_MUSIC[loc.enemy_id]}
        label={enemyLabel}
        muted={musicMuted}
        onToggleMute={() => setMusicMuted(m => !m)}
      />

      {/* ── Abandon confirmation ──────────────────────────────────────── */}
      {showAbandonConfirm && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={`${s.endTitle} ${s.fleedTitle}`}>Abandon Workflow?</div>
            <ul className={s.abandonList}>
              <li className={s.abandonCon}>✗ Ends this run immediately — same as a defeat.</li>
              <li className={s.abandonCon}>✗ Forfeits all progress and runes earned this fight.</li>
              <li className={s.abandonCon}>✗ −{Math.round(ABANDON_PENALTY * 100)}% rewards on your next run's first workflow.</li>
              <li className={s.abandonPro}>✓ Your banked runes stay safe — nothing drops here, unlike a defeat.</li>
            </ul>
            <div className={s.confirmActions}>
              <button className={s.btnCancel} onClick={() => setShowAbandonConfirm(false)}>
                Keep fighting
              </button>
              <button
                className={s.btnConfirmDanger}
                onClick={() => { setShowAbandonConfirm(false); dispatch({ type: 'ABANDON' }) }}
              >
                Abandon anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fled overlay ───────────────────────────────────────────────── */}
      {state.phase === 'FLED' && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={`${s.endTitle} ${s.fleedTitle}`}>Abandoned</div>
            <div className={s.endSub}>
              You abandoned the workflow.<br />
              Next workflow rewards will be penalised by {Math.round(ABANDON_PENALTY * 100)}%.
            </div>
            <button className={s.endBtn} onClick={handleFlee}>Return</button>
          </div>
        </div>
      )}
    </div>
  )
}
