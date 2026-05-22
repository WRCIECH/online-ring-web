import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { statLevelCost, weaponUpgradeCost, WEAPONS } from '../data/weapons'
import type { StatKey } from '../types/game'
import s from './RunCompleteScreen.module.css'

const STAT_LABELS: Record<StatKey, string> = {
  VIG: 'Vigor', END: 'Endurance', MND: 'Mind',
  STR: 'Strength', DEX: 'Dexterity', INT: 'Intelligence', FAI: 'Faith', ARC: 'Arcane',
}
const STAT_EFFECT: Record<StatKey, string> = {
  VIG: 'HP', END: 'Stamina', MND: 'FP',
  STR: 'STR scaling', DEX: 'DEX scaling', INT: 'INT scaling', FAI: 'FAI scaling', ARC: 'ARC scaling',
}
const ALL_STATS: StatKey[] = ['VIG','END','MND','STR','DEX','INT','FAI','ARC']

export default function RunCompleteScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()

  const levelCost = statLevelCost(store.total_levels_spent)

  function handleLevelStat(stat: StatKey) {
    store.spendRunesOnStat(stat)
  }

  function handleUpgradeWeapon(weaponId: string) {
    store.upgradeWeapon(weaponId)
  }

  return (
    <div className={s.root}>
      <h1 className={s.title}>Run Complete</h1>
      <p className={s.subtitle}>{store.run_location_name || `Run #${store.run_count}`} — Location cleared!</p>

      <div className={s.runeBalance}>
        <span className={s.runeIcon}>✦</span>
        <span className={s.runeCount}>{store.runes.toLocaleString()}</span>
        <span className={s.runeLabel}>runes</span>
      </div>

      <div className={s.card}>
        {/* ── Level Up ──────────────────────────────────────────────── */}
        <div className={s.section}>
          <div className={s.sectionTitle}>Level Up — {levelCost} ✦ each</div>
          <div className={s.statGrid}>
            {ALL_STATS.map(stat => {
              const canAfford = store.runes >= levelCost
              return (
                <button
                  key={stat}
                  className={[s.statBtn, !canAfford ? s.statBtnDisabled : ''].join(' ')}
                  disabled={!canAfford}
                  onClick={() => handleLevelStat(stat)}
                >
                  <span className={s.statName}>{STAT_LABELS[stat]}</span>
                  <span className={s.statValue}>{store.stats[stat]}</span>
                  <span className={s.statEffect}>{STAT_EFFECT[stat]}</span>
                </button>
              )
            })}
          </div>
          {store.runes < levelCost && (
            <p className={s.hint}>Need {levelCost} ✦ to level up</p>
          )}
        </div>

        {/* ── Upgrade Weapons ───────────────────────────────────────── */}
        <div className={s.section}>
          <div className={s.sectionTitle}>Upgrade Weapons</div>
          <div className={s.weaponList}>
            {store.owned_weapons.map(wid => {
              const weapon = WEAPONS[wid]
              if (!weapon) return null
              const level = store.weapon_level[wid] ?? 0
              const isMax = level >= 10
              const cost  = weaponUpgradeCost(level)
              const canAfford = !isMax && store.runes >= cost
              return (
                <div key={wid} className={s.weaponRow}>
                  <span className={s.weaponName}>{weapon.name}</span>
                  <span className={s.weaponLevel}>+{level}{isMax ? ' MAX' : ''}</span>
                  {!isMax && (
                    <button
                      className={[s.btnUpgrade, !canAfford ? s.btnUpgradeDisabled : ''].join(' ')}
                      disabled={!canAfford}
                      onClick={() => handleUpgradeWeapon(wid)}
                    >
                      ↑ {cost} ✦
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={s.footer}>
          <button className={s.btnContinue} onClick={() => navigate('/locations')}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}
