import { useState } from 'react'
import { createPortal } from 'react-dom'
import CharacterOverlay from '../overlays/CharacterOverlay'
import CampaignOverlay from '../overlays/CampaignOverlay'
import AnalyticsOverlay from '../overlays/AnalyticsOverlay'
import RewardsOverlay from '../overlays/RewardsOverlay'
import CodexOverlay from '../overlays/CodexOverlay'
import { useT } from '../../i18n'
import s from './ActionBar.module.css'

interface Props {
  canLevel?: boolean
}

export default function ActionBar({ canLevel = true }: Props) {
  const t = useT()
  const [showStats,     setShowStats]     = useState(false)
  const [showContent,   setShowContent]   = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showRewards,   setShowRewards]   = useState(false)
  const [showCodex,     setShowCodex]     = useState(false)

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
        {/* Campaigns */}
        <button className={s.btn} data-tooltip={t.ui.btn_campaigns} onClick={() => setShowContent(true)}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="3" y="3" width="14" height="14" rx="2"/>
            <line x1="7" y1="7" x2="13" y2="7"/>
            <line x1="7" y1="10" x2="13" y2="10"/>
            <line x1="7" y1="13" x2="11" y2="13"/>
          </svg>
        </button>
        {/* Analytics */}
        <button className={s.btn} data-tooltip={t.ui.btn_analytics} onClick={() => setShowAnalytics(true)}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,14 7,9 11,12 17,5"/>
            <line x1="3" y1="17" x2="17" y2="17"/>
          </svg>
        </button>
        {/* Rewards */}
        <button className={s.btn} data-tooltip={t.ui.btn_rewards ?? 'Rewards'} onClick={() => setShowRewards(true)}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3 L12.5 8 L18 8.5 L14 12.5 L15.5 18 L10 15 L4.5 18 L6 12.5 L2 8.5 L7.5 8 Z"/>
          </svg>
        </button>
        {/* Codex */}
        <button className={s.btn} data-tooltip={(t.ui as Record<string, string>).btn_codex ?? 'Kodeks'} onClick={() => setShowCodex(true)}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="2" width="11" height="16" rx="1"/>
            <path d="M14 2h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-1"/>
            <line x1="6" y1="6" x2="11" y2="6"/>
            <line x1="6" y1="9" x2="11" y2="9"/>
            <line x1="6" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
      {showStats     && createPortal(<CharacterOverlay onClose={() => setShowStats(false)}    canLevel={canLevel} />, document.body)}
      {showContent   && createPortal(<CampaignOverlay  onClose={() => setShowContent(false)} />, document.body)}
      {showAnalytics && createPortal(<AnalyticsOverlay onClose={() => setShowAnalytics(false)} />, document.body)}
      {showRewards   && createPortal(<RewardsOverlay   onClose={() => setShowRewards(false)}  />, document.body)}
      {showCodex     && createPortal(<CodexOverlay     onClose={() => setShowCodex(false)}    />, document.body)}
    </>
  )
}
