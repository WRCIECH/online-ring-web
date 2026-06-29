import { useState } from 'react'
import { createPortal } from 'react-dom'
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
        {/* Character / stats */}
        <button className={s.btn} data-tooltip={t.ui.btn_stats} onClick={() => setShowStats(true)}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="6" r="3"/>
            <path d="M4 18c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
          </svg>
        </button>
        {/* Content pipeline */}
        <button className={s.btn} data-tooltip={t.ui.btn_pipeline} onClick={() => setShowContent(true)}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="3" y="3" width="14" height="14" rx="2"/>
            <line x1="7" y1="7" x2="13" y2="7"/>
            <line x1="7" y1="10" x2="13" y2="10"/>
            <line x1="7" y1="13" x2="11" y2="13"/>
          </svg>
        </button>
        {/* Equipment */}
        <button className={s.btn} data-tooltip={t.ui.btn_equipment} onClick={() => setShowEquip(true)}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="4" y1="16" x2="16" y2="4"/>
            <path d="M13 4l3 3-2 2-3-3z"/>
            <path d="M4 13l3 3-2 1z"/>
          </svg>
        </button>
        {/* Analytics */}
        <button className={s.btn} data-tooltip={t.ui.btn_analytics} onClick={() => setShowAnalytics(true)}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,14 7,9 11,12 17,5"/>
            <line x1="3" y1="17" x2="17" y2="17"/>
          </svg>
        </button>
      </div>
      {showStats     && createPortal(<CharacterOverlay onClose={() => setShowStats(false)}    canLevel={canLevel} />, document.body)}
      {showContent   && createPortal(<ContentOverlay   onClose={() => setShowContent(false)}  canAdd={canAddContent} />, document.body)}
      {showEquip     && createPortal(<EquipOverlay     onClose={() => setShowEquip(false)} />, document.body)}
      {showAnalytics && createPortal(<AnalyticsOverlay onClose={() => setShowAnalytics(false)} />, document.body)}
    </>
  )
}
