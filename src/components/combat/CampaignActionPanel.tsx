import { useState } from 'react'
import { calcTileDamage } from '../../engine/combat'
import type { WeaponCampaign, WeaponInstance, WorkflowTile } from '../../types/game'
import s from './CampaignActionPanel.module.css'

const HEAVY_TILE: WorkflowTile = {
  id: '_campaign_heavy', type: 'Produce', name: '',
  time_light: 30, time_heavy: 60, is_completed: false, repeat_count: 0,
}
const LIGHT_TILE: WorkflowTile = {
  id: '_campaign_light', type: 'Research', name: '',
  time_light: 30, time_heavy: 60, is_completed: false, repeat_count: 0,
}

interface Props {
  campaign: WeaponCampaign
  weapon: WeaponInstance | undefined
  weaponLevel: number
  superhitCharges: number
  canAct: boolean
  onMicro:    (damage: number) => void
  onMedium:   (damage: number) => void
  onHeavy:    (type: 'research' | 'produce', damage: number) => void
  onSuperhit: (damage: number) => void
}

export default function CampaignActionPanel({
  campaign, weapon, weaponLevel, superhitCharges, canAct,
  onMicro, onMedium, onHeavy, onSuperhit,
}: Props) {
  const [heavyPicking, setHeavyPicking] = useState(false)

  const heavyDmg  = Math.round(calcTileDamage(HEAVY_TILE, 'Heavy', weapon, weaponLevel))
  const lightDmg  = Math.round(calcTileDamage(LIGHT_TILE, 'Light', weapon, weaponLevel))
  const superhitDmg = Math.round(calcTileDamage(LIGHT_TILE, 'Light', weapon, weaponLevel) * 5)

  const hasMicro  = !!(campaign.micro  && !campaign.micro.completed)
  const hasMedium = !!(campaign.medium && campaign.medium.pieces.some(p => !p.level2_done))
  const hasHeavy  = !!(campaign.heavy  && !campaign.heavy.completed)
  const canShit   = superhitCharges > 0

  function handleHeavySub(type: 'research' | 'produce') {
    setHeavyPicking(false)
    onHeavy(type, heavyDmg)
  }

  return (
    <div className={s.panel}>
      {/* Micro */}
      <button
        className={[s.tile, s.tileMicro, !hasMicro || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!hasMicro || !canAct}
        onClick={() => onMicro(heavyDmg)}
      >
        <span className={s.tileLabel}>Micro</span>
        <span className={s.tileDmg}>⚔ {heavyDmg}</span>
        <span className={s.tileHint}>publish</span>
      </button>

      {/* Medium */}
      <button
        className={[s.tile, s.tileMedium, !hasMedium || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!hasMedium || !canAct}
        onClick={() => onMedium(lightDmg)}
      >
        <span className={s.tileLabel}>Medium</span>
        <span className={s.tileDmg}>⚔ {lightDmg}</span>
        <span className={s.tileHint}>next piece</span>
      </button>

      {/* Heavy */}
      <div className={s.heavyWrap}>
        {heavyPicking ? (
          <div className={s.heavySub}>
            <button className={s.heavySubBtn} onClick={() => handleHeavySub('research')}>Research</button>
            <button className={s.heavySubBtn} onClick={() => handleHeavySub('produce')}>Produce</button>
            <button className={s.heavyCancel} onClick={() => setHeavyPicking(false)}>✕</button>
          </div>
        ) : (
          <button
            className={[s.tile, s.tileHeavy, !hasHeavy || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
            disabled={!hasHeavy || !canAct}
            onClick={() => setHeavyPicking(true)}
          >
            <span className={s.tileLabel}>Heavy</span>
            <span className={s.tileDmg}>⚔ {heavyDmg}</span>
            <span className={s.tileHint}>R / P</span>
          </button>
        )}
      </div>

      {/* Superhit */}
      <button
        className={[s.tile, s.tileSuperhit, !canShit || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!canShit || !canAct}
        onClick={() => onSuperhit(superhitDmg)}
      >
        <span className={s.tileLabel}>Superhit</span>
        <span className={s.tileDmg}>⚔ {superhitDmg}</span>
        <span className={s.tileHint}>{superhitCharges} charge{superhitCharges !== 1 ? 's' : ''}</span>
      </button>
    </div>
  )
}
