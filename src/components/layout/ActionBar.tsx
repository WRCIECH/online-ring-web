import { useState } from 'react'
import CharacterOverlay from '../overlays/CharacterOverlay'
import ContentOverlay   from '../overlays/ContentOverlay'
import EquipOverlay     from '../overlays/EquipOverlay'
import AnalyticsOverlay from '../overlays/AnalyticsOverlay'
import { useT } from '../../i18n'
import s from './ActionBar.module.css'

interface Props {
  canLevel?:      boolean
  canAddContent?: boolean
}

export default function ActionBar({ canLevel = true, canAddContent = true }: Props) {
  const t = useT()
  const [showStats,     setShowStats]     = useState(false)
  const [showContent,   setShowContent]   = useState(false)
  const [showEquip,     setShowEquip]     = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  return (
    <>
      <div className={s.bar}>
        <button className={s.btn} data-tooltip={t.ui.btn_stats}     onClick={() => setShowStats(true)}>📊</button>
        <button className={s.btn} data-tooltip={t.ui.btn_pipeline}  onClick={() => setShowContent(true)}>📋</button>
        <button className={s.btn} data-tooltip={t.ui.btn_equipment} onClick={() => setShowEquip(true)}>⚔</button>
        <button className={s.btn} data-tooltip={t.ui.btn_analytics} onClick={() => setShowAnalytics(true)}>📈</button>
      </div>
      {showStats     && <CharacterOverlay onClose={() => setShowStats(false)}    canLevel={canLevel} />}
      {showContent   && <ContentOverlay   onClose={() => setShowContent(false)}  canAdd={canAddContent} />}
      {showEquip     && <EquipOverlay     onClose={() => setShowEquip(false)} />}
      {showAnalytics && <AnalyticsOverlay onClose={() => setShowAnalytics(false)} />}
    </>
  )
}
