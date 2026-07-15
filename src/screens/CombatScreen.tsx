import { useReducer, useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { combatReducer, initCombatState, getReachableTiles, previewMove, formatMultiplierPct, calcTileDamage, calcFlowMult, calcCampaignOverloadMult, ABANDON_PENALTY } from '../engine/combat'
import { FLOW_GAP_HOT_MINS, FLOW_GAP_WARM_MINS } from '../data/constants'
import { useGameStore, selectAvailableNodes } from '../store/gameStore'
import { ENEMIES } from '../data/enemies'
import { WEAPONS } from '../data/weapons'
import { playSound } from '../engine/sound'
import type { WeaponInstance, WeaponRarity, MoveType, WorkflowGraph, RewardTier } from '../types/game'
import { rollWeapon } from '../data/generators/weaponGenerator'
import { generateWorkflow } from '../data/generators/workflowGenerator'
import { isNodeAvailable } from '../data/generators/campaignGenerator'
import RunHeader    from '../components/layout/RunHeader'
import TimerOverlay from '../components/combat/TimerOverlay'
import CombatLog    from '../components/combat/CombatLog'
import WorkflowCanvas from '../components/combat/WorkflowCanvas'
import MoveRadialMenu, { type RadialMoveItem } from '../components/combat/MoveRadialMenu'
import CombatBottomBar from '../components/combat/CombatBottomBar'
import CombatMusic  from '../components/combat/CombatMusic'
import PreFightPicker from '../components/overlays/PreFightPicker'
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

const REWARD_COLOURS: Record<RewardTier, string> = {
  C: '#aaaaaa', B1: '#4488cc', B2: '#4488cc',
  A1: '#9944cc', A2: '#9944cc', S: '#ee8822',
}


export default function CombatScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const t        = useT()
  const loc      = store.pending_encounter

  useEffect(() => { if (!loc) navigate('/map') }, [loc, navigate])

  const enemyData = loc ? ENEMIES[loc.enemy_id] : null

  // ── Weapons available in combat: activated campaign with named available nodes ──
  const weaponsWithContent = store.weapon_instances.filter(w => {
    const c = store.weapon_campaigns[w.instance_id]
    if (!c || !c.activated) return false
    const available = c.nodes.filter(n => !n.completed && isNodeAvailable(c.nodes, c.edges, n))
    return available.length > 0 && available.every(n => n.name.trim() !== '')
  })

  // ── Initial weapon (seeds the very first/resumed workflow only) ──────────
  const initialWeaponId    =
    (store.pending_weapon_id && store.weapon_instances.find(w => w.instance_id === store.pending_weapon_id))
      ? store.pending_weapon_id
      : weaponsWithContent[0]?.instance_id ?? store.weapon_instances[0]?.instance_id ?? 'unarmed'
  const initialWeapon      = WEAPONS[initialWeaponId] as WeaponInstance | undefined
  const initialWeaponLevel = store.weapon_level[initialWeaponId] ?? 0
  const initialWeaponClass  = initialWeapon?.weapon_class ?? 'straight_swords'
  const initialWeaponRarity = initialWeapon?.rarity        ?? 'common'

  const activeWeaponCampaign = store.weapon_campaigns[initialWeaponId]

  // ── Flow bonus — computed once at fight init from last fight end time ────
  const initialFlowMult = calcFlowMult(store.last_fight_ended_at)

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
      const workflow = (store.active_content_id ? store.workflow_progress[store.active_content_id] : undefined)
        ?? generateWorkflow(initialWeaponClass, initialWeaponRarity, spawnAsBoss, initialWeapon?.rolled_draws)

      const activeCampaignCount = store.owned_weapons.filter(wid => {
        const c = store.weapon_campaigns[wid]
        return c && c.activated === true && !c.completed
      }).length
      const campaignOverloadMult = calcCampaignOverloadMult(activeCampaignCount, store.stats.END)
      const campaignDoneMult = 1.0 + 0.05 * (activeWeaponCampaign?.done_count ?? 0)

      const initialStreak = store.active_content_id ? (store.content_streak[store.active_content_id] ?? 0) : 0

      return initCombatState(
        workflow, enemyData, loc.enemy_id,
        initialWeaponId, initialWeaponLevel,
        store.current_hp, store.maxHp(),
        store.run_estus_count,
        store.stats,
        store.abandon_penalty,
        spawnAsBoss,
        loc.locationTheme,
        initialFlowMult,
        campaignOverloadMult,
        campaignDoneMult,
        initialStreak,
        store.last_fight_ended_at,
      )
    }
  )

  // ── Live active weapon (can change mid-fight via SWITCH_WEAPON) ──────────
  const weapon  = WEAPONS[state.equippedWeaponId] as WeaponInstance | undefined

  // Per-content-node workflow cache: preserves progress when switching away and back
  type ContentSnapshot = { workflow: WorkflowGraph; streak: number }
  const contentCache = useRef<Record<string, ContentSnapshot>>(
    store.active_content_id
      ? { [store.active_content_id]: { workflow: state.workflow, streak: state.consistencyStreak } }
      : {}
  )
  // Keep the cache current as tiles are completed for the active weapon
  const stateRef = useRef(state)
  stateRef.current = state

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
  const [lootItems,  setLootItems]  = useState<LootItem[] | null>(null)
  const [rewardDrop, setRewardDrop] = useState<RewardTier | null>(null)

  function rollRewardTier(): RewardTier {
    const r = Math.random()
    if (r < 0.64)       return 'C'
    if (r < 0.94)       return Math.random() < 0.5 ? 'B1' : 'B2'
    if (r < 0.99)       return Math.random() < 0.5 ? 'A1' : 'A2'
    return 'S'
  }

  useEffect(() => {
    if (state.phase !== 'VICTORY' || !loc || lootItems !== null) return
    const enemy        = ENEMIES[loc.enemy_id]
    const defeatedBefore = store.run_defeated_enemies.includes(loc.enemy_id)
    const sub          = loc.sublocation_type
    const minRarity: WeaponRarity =
      sub === 'boss' || sub === 'event' ? 'rare' :
      sub === 'elite'                   ? 'Intellectual' : 'common'

    const dropMult = sub === 'elite' ? 0.8 : sub === 'mob' ? 0.7 : 1.0
    const items: LootItem[] = []
    for (const drop of enemy.drops) {
      const chance = (defeatedBefore ? drop.repeat_chance : drop.first_kill_chance) * dropMult
      if (Math.random() < chance) {
        const w = rollWeapon(undefined, minRarity)
        items.push({ name: w.name, rarity: w.rarity, instance: w })
      }
    }
    setLootItems(items)
    setRewardDrop(rollRewardTier())
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
    if (rewardDrop) store.addReward(rewardDrop)
    store.addDefeatedEnemy(loc.enemy_id)
    store.recordFightEnd()
    // Persist or clear workflow; always save streak
    const allDone = state.workflow.tiles.every(t => t.is_completed)
    if (allDone) {
      if (store.active_content_id) {
        store.completeCampaignNode(state.equippedWeaponId, store.active_content_id, state.workflow)
        // completeCampaignNode clears the streak for this node
      }
      store.clearActiveWorkflow()
    } else {
      store.saveWorkflowProgress(state.workflow)
      if (store.active_content_id) store.saveContentStreak(store.active_content_id, state.consistencyStreak)
    }
    const isLast = store.run_current_index >= store.run_location_sequence.length - 1
    store.advanceRun()
    if (isLast) { store.endRunVictory(); navigate('/run-complete') }
    else        { store.setPendingEncounter(null); navigate('/map') }
  }, [loc, store, navigate, state, lootItems, rewardDrop, enemyData])

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
    if (store.active_content_id) store.clearContentStreak(store.active_content_id)
    store.clearActiveWorkflow()
    store.endRunFailure()
    navigate('/')
  }, [store, navigate, state])

  const [musicMuted, setMusicMuted] = useState(() => localStorage.getItem('music_muted') === '1')

  const toggleMusicMuted = useCallback(() => {
    setMusicMuted(m => {
      const next = !m
      localStorage.setItem('music_muted', next ? '1' : '0')
      return next
    })
  }, [])
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [showAdvancePicker, setShowAdvancePicker]   = useState(false)
  // If a campaign node was already locked in the store, skip the picker entirely
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    store.active_content_id ?? null
  )

  // Switches weapon + content from the bottom bar dropdown; streak always resets to 0
  const handleSelectContent = useCallback((weaponId: string, contentId: string) => {
    const cur = stateRef.current
    if (contentId === selectedContentId && weaponId === cur.equippedWeaponId) return

    // Persist outgoing content to both in-memory cache and the store so progress
    // survives even if this component unmounts before the player switches back.
    // saveWorkflowProgress reads active_content_id from the store, which still
    // points to the outgoing content at this point (we update it below).
    // Streak resets to 0 on switch — mirroring what SWITCH_WORKFLOW does in combat state.
    if (selectedContentId) {
      contentCache.current[selectedContentId] = { workflow: cur.workflow, streak: 0 }
      store.saveWorkflowProgress(cur.workflow)
      store.saveContentStreak(selectedContentId, 0)
    }

    if (weaponId !== cur.equippedWeaponId) {
      dispatch({ type: 'SWITCH_WEAPON', weaponId, weaponLevel: store.weapon_level[weaponId] ?? 0 })
    }

    const pickedWeapon = WEAPONS[weaponId] as WeaponInstance | undefined
    const cached       = contentCache.current[contentId]
    const newWorkflow  = cached?.workflow
      ?? store.workflow_progress[contentId]
      ?? generateWorkflow(
        pickedWeapon?.weapon_class ?? 'straight_swords',
        pickedWeapon?.rarity       ?? 'common',
        loc?.sublocation_type === 'boss',
        pickedWeapon?.rolled_draws,
      )
    setSelectedContentId(contentId)
    store.setActiveContentId(contentId)
    // No consistencyStreak → defaults to 0 → breaks the streak
    dispatch({ type: 'SWITCH_WORKFLOW', workflow: newWorkflow })
  }, [selectedContentId, loc, store])

  // Flow countdown — seconds until the current flow tier expires
  const [flowCountdown, setFlowCountdown] = useState('')
  useEffect(() => {
    if (!store.last_fight_ended_at || state.flowMult <= 1.0) { setFlowCountdown(''); return }
    const targetMins = state.flowMult >= 1.5 ? FLOW_GAP_HOT_MINS : FLOW_GAP_WARM_MINS
    function tick() {
      const remainingMs = Math.max(0, targetMins * 60000 - (Date.now() - store.last_fight_ended_at!))
      const m = Math.floor(remainingMs / 60000)
      const s = Math.floor((remainingMs % 60000) / 1000)
      setFlowCountdown(`${m}:${s.toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [store.last_fight_ended_at, state.flowMult])

  const activeContent = selectAvailableNodes(store as Parameters<typeof selectAvailableNodes>[0], state.equippedWeaponId)
  const selectedContent = activeContent.find(c => c.id === selectedContentId) ?? null

  // Superhit: base charge per published node + one per promote
  const superhitSourceNode = store.weapon_campaigns[state.equippedWeaponId]?.nodes
    .find(n => {
      if (!n.published) return false
      const base     = n.superhit_used ? 0 : 1
      const promotes = Math.max(0, (n.promote_count ?? 0) - (n.promotes_consumed ?? 0))
      return base + promotes > 0
    }) ?? null
  const canSuperhit = superhitSourceNode !== null
  const totalSuperhitCharges = (store.weapon_campaigns[state.equippedWeaponId]?.nodes ?? [])
    .reduce((sum, n) => {
      if (!n.published) return sum
      const base     = n.superhit_used ? 0 : 1
      const promotes = Math.max(0, (n.promote_count ?? 0) - (n.promotes_consumed ?? 0))
      return sum + base + promotes
    }, 0)

  const handleContinueContent = () => {
    // Mark the completed node before opening picker so children are unblocked immediately
    if (selectedContentId) {
      store.completeCampaignNode(state.equippedWeaponId, selectedContentId, state.workflow)
      setSelectedContentId(null)
    }
    setShowAdvancePicker(true)
  }

  function handleAdvanceConfirm(pickedWeaponId: string, contentId: string) {
    setShowAdvancePicker(false)
    const cur = stateRef.current
    const pickedWeapon = WEAPONS[pickedWeaponId] as WeaponInstance | undefined

    if (pickedWeaponId !== cur.equippedWeaponId) {
      dispatch({ type: 'SWITCH_WEAPON', weaponId: pickedWeaponId, weaponLevel: store.weapon_level[pickedWeaponId] ?? 0 })
    }

    const newWorkflow = contentCache.current[contentId]?.workflow
      ?? store.workflow_progress[contentId]
      ?? generateWorkflow(
        pickedWeapon?.weapon_class ?? 'straight_swords',
        pickedWeapon?.rarity       ?? 'common',
        loc?.sublocation_type === 'boss',
        pickedWeapon?.rolled_draws,
      )
    const savedStreak = store.content_streak[contentId] ?? 0
    setSelectedContentId(contentId)
    store.setActiveContentId(contentId)
    dispatch({ type: 'SWITCH_WORKFLOW', workflow: newWorkflow, consistencyStreak: savedStreak })
  }

  function handleAdvanceClose() {
    setShowAdvancePicker(false)
    const cur = stateRef.current
    const w = WEAPONS[cur.equippedWeaponId] as WeaponInstance | undefined
    const newWorkflow = generateWorkflow(
      w?.weapon_class ?? 'straight_swords',
      w?.rarity ?? 'common',
      loc?.sublocation_type === 'boss',
      w?.rolled_draws,
    )
    dispatch({ type: 'SWITCH_WORKFLOW', workflow: newWorkflow })
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
    if (tile.is_advance) { handleContinueContent(); return }
    dispatch({ type: 'SELECT_TILE', tileId })
    setRadialPos({ x, y })
  }, [isPlayerTurn, state.workflow, reachableTiles, handleContinueContent])

  const radialItems = useMemo<RadialMoveItem[]>(() => {
    if (!radialPos || !selectedTile) return []
    const items: RadialMoveItem[] = []
    const allDefs = MOVE_DEFS.length + (canSuperhit ? 1 : 0)

    MOVE_DEFS.forEach((def, i) => {
      const angle   = Math.PI - (i / allDefs) * 2 * Math.PI
      const preview = previewMove(state, selectedTile, def.move)
      items.push({
        id: def.move,
        label: def.label,
        sublabel: `${fmtMoveTime(preview.duration)} · ${def.desc}`,
        metaParts: [
          { text: `⚔ ${preview.damage}`, color: '#cc6644' },
          ...preview.multipliers.filter(m => m.active).map(m => ({
            text:    `${(t.ui as Record<string,string>)[`mult_${m.key}`] ?? m.key} ${formatMultiplierPct(m.value)}`,
            tooltip: (t.ui as Record<string,string>)[`mult_${m.key}_desc`],
            subtext: m.detail,
          })),
        ],
        colorVar: def.colorVar,
        tx: Math.cos(angle) * RADIAL_RADIUS,
        ty: Math.sin(angle) * RADIAL_RADIUS,
        onSelect: () => dispatch({ type: 'CHOOSE_MOVE', move: def.move }),
      })
    })

    if (canSuperhit && superhitSourceNode) {
      const i     = MOVE_DEFS.length
      const angle = Math.PI - (i / allDefs) * 2 * Math.PI
      const superhitDmg = Math.round(
        calcTileDamage(selectedTile, 'Light', weapon, store.weapon_level[state.equippedWeaponId] ?? 0, store.stats) * 5
      )
      items.push({
        id: 'Superhit',
        label: 'SUPER',
        sublabel: `×${totalSuperhitCharges} · 5× light · instant`,
        metaParts: [
          { text: `⚔ ${superhitDmg}`, color: '#eecc44' },
          { text: `published: ${superhitSourceNode.name || 'Untitled'}`, color: '#aaaaaa' },
        ],
        colorVar: '#eecc44',
        tx: Math.cos(angle) * RADIAL_RADIUS,
        ty: Math.sin(angle) * RADIAL_RADIUS,
        onSelect: () => {
          dispatch({ type: 'SUPERHIT', tile: selectedTile })
          store.useSuperhitOnNode(state.equippedWeaponId, superhitSourceNode.id)
          setRadialPos(null)
        },
      })
    }

    return items
  }, [radialPos, selectedTile, state, t, canSuperhit, superhitSourceNode, weapon, store])

  if (!loc || !enemyData) return null

  const enemyLabel = loc.boss_name ?? enemyData.name

  return (
    <div className={s.root}>
      <RunHeader
        hp={state.playerHp} maxHp={state.playerMaxHp}
        canLevel={false}
      />

      {selectedContent && (() => {
        const currentCampaign = store.weapon_campaigns[state.equippedWeaponId]
        const parentEdge = currentCampaign?.edges.find(e => e.to_id === selectedContentId)
        const edgeLabel = parentEdge?.label ?? null
        const edgeLabelText = edgeLabel
          ? ((t.content.transformation as Record<string, { badge_label: string }>)[edgeLabel]?.badge_label
            ?? edgeLabel)
          : null
        const parentNode = parentEdge
          ? currentCampaign?.nodes.find(n => n.id === parentEdge.from_id)
          : null
        const primaryFormat = (WEAPONS[state.equippedWeaponId] as WeaponInstance | undefined)
          ?.rolled_draws?.format[0]?.[0]
        const formatLabel = primaryFormat
          ? (t.content.product[primaryFormat]?.badge_label ?? primaryFormat)
          : null
        return (
          <div className={s.contentBar}>
            <div className={s.contentBarRow1}>
              <span className={s.contentBarLabel}>{t.ui.working_on}</span>
              <span className={s.contentBarTitle}>{selectedContent.name}</span>
              {currentCampaign?.campaign_name && (
                <span className={s.contentBarCampaign}>— {currentCampaign.campaign_name}</span>
              )}
            </div>
            {(formatLabel || edgeLabelText) && (
              <div className={s.contentBarRow2}>
                {formatLabel && (
                  <span className={s.contentBarFormat}>
                    {t.ui.required_format ?? 'Format'}: <strong>{formatLabel}</strong>
                  </span>
                )}
                {edgeLabelText && (
                  <span className={s.contentBarRelation}>
                    {formatLabel ? ' · ' : ''}↳ {edgeLabelText}{parentNode?.name ? ` from "${parentNode.name}"` : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {(() => {
        const tui = t.ui as Record<string, string>
        const streakMult = 1.0 + Math.min(0.5, 0.05 * state.consistencyStreak)
        const badges = [
          state.flowMult > 1.0 && {
            key: 'flow',
            label: `⚡ ${tui.mult_flow} ×${state.flowMult.toFixed(1)}${flowCountdown ? `  ${flowCountdown}` : ''}`,
            cls: state.flowMult >= 1.5 ? s.badgeHot : s.badgeWarm,
            tooltip: tui.mult_flow_desc,
          },
          state.consistencyStreak > 0 && {
            key: 'streak',
            label: `🔥 ${tui.mult_streak} ×${streakMult.toFixed(2)}`,
            cls: s.badgeStreak,
            tooltip: `${tui.mult_streak_desc} (${tui.mult_streak}: ${state.consistencyStreak})`,
          },
          state.campaignDoneMult > 1.0 && {
            key: 'campaignDone',
            label: `✦ ${tui.mult_campaignDone} +${Math.round((state.campaignDoneMult - 1) * 100)}%`,
            cls: s.badgeStreak,
            tooltip: tui.mult_campaignDone_desc,
          },
          state.campaignOverloadMult < 1.0 && {
            key: 'overload',
            label: `⚠ ${tui.mult_campaignOverload} −${Math.round((1 - state.campaignOverloadMult) * 100)}%`,
            cls: s.badgeDebuff,
            tooltip: tui.mult_campaignOverload_desc,
          },
          state.incomingPenalty > 0 && {
            key: 'abandon',
            label: `↓ ${tui.mult_abandon} −${Math.round(state.incomingPenalty * 100)}%`,
            cls: s.badgeDebuff,
            tooltip: tui.mult_abandon_desc,
          },
        ].filter(Boolean) as Array<{ key: string; label: string; cls: string; tooltip: string }>

        if (badges.length === 0) return null
        return (
          <div className={s.buffBar}>
            {badges.map(b => (
              <span key={b.key} className={`${s.buff} ${b.cls}`} data-tooltip={b.tooltip}>
                {b.label}
              </span>
            ))}
          </div>
        )
      })()}

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
              affinities: enemyData.affinities,
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
        activeContentId={selectedContentId ?? undefined}
        weaponLevels={store.weapon_level}
        weaponNodes={Object.fromEntries(
          weaponsWithContent.map(w => {
            const c = store.weapon_campaigns[w.instance_id]
            return [
              w.instance_id,
              (c?.nodes ?? [])
                .filter(n => !n.completed && isNodeAvailable(c!.nodes, c!.edges, n))
                .map(n => ({ id: n.id, name: n.name || 'Untitled' })),
            ]
          })
        )}
        playerEstus={state.playerEstus}
        canAct={isPlayerTurn}
        onSelectContent={handleSelectContent}
        onEstus={() => dispatch({ type: 'USE_ESTUS' })}
        onAbandon={() => setShowAbandonConfirm(true)}
      />

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

            {rewardDrop && (
              <div className={s.rewardDrop}>
                <span className={s.rewardDropLabel}>{t.ui.reward_earned}</span>
                <span className={s.rewardDropTier} style={{ color: REWARD_COLOURS[rewardDrop] }}>
                  {store.reward_names[rewardDrop] || t.ui[`reward_tier_${rewardDrop}` as keyof typeof t.ui] || rewardDrop}
                </span>
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
        onToggleMute={toggleMusicMuted}
      />

      {/* ── Abandon confirmation ──────────────────────────────────────── */}
      {showAbandonConfirm && (
        <div className={s.endOverlay}>
          <div className={s.endBox}>
            <div className={`${s.endTitle} ${s.fleedTitle}`}>Escape Fight?</div>
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

      {/* ── Advance picker — opened when the advance tile is clicked ───── */}
      {showAdvancePicker && loc && (
        <PreFightPicker
          loc={loc}
          onConfirm={handleAdvanceConfirm}
          onCancel={handleAdvanceClose}
        />
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
