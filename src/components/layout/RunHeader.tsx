import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore, selectRunRemainingSeconds } from '../../store/gameStore'
import { LOCATION_DEFINITIONS } from '../../data/locations'
import { LOCATION_THEMES } from '../../data/locationThemes'
import HomeLogo from '../HomeLogo'
import ActionBar from './ActionBar'
import { useT } from '../../i18n'
import s from './RunHeader.module.css'

const LOC_MAP = Object.fromEntries(LOCATION_DEFINITIONS.map(l => [l.id, l]))

interface Props {
  hp: number; maxHp: number
  canLevel?: boolean
}

function fmtTime(secs: number): string {
  if (secs <= 0) return '00:00:00'
  const h  = Math.floor(secs / 3600)
  const m  = Math.floor((secs % 3600) / 60)
  const sc = Math.floor(secs % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
}

export default function RunHeader({ hp, maxHp, canLevel = true }: Props) {
  const store = useGameStore()
  const t = useT()
  const [remaining, setRemaining] = useState(() =>
    selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
  )
  const [locTipPos, setLocTipPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0]))
    }, 1000)
    return () => clearInterval(id)
  }, [store])

  const isUrgent  = remaining < 7200
  const fillPct   = maxHp > 0 ? Math.min(100, hp / maxHp * 100) : 0
  const locDef    = store.run_location_name ? LOC_MAP[store.run_location_name] : null
  const locName   = locDef?.displayName ?? store.run_location_name ?? `Run #${store.run_count + 1}`
  const locTheme  = locDef ? LOCATION_THEMES[locDef.theme] : null

  return (
    <>
    <header className={s.header}>
      {/* Left: logo + HP */}
      <div className={s.leftGroup}>
        <HomeLogo />
        <div className={s.hpSection}>
          <span className={s.hpLabel}>HP</span>
          <div className={s.hpBarTrack}>
            <div className={s.hpBarFill} style={{ width: `${fillPct}%` }} />
          </div>
          <span className={s.hpText}>{Math.floor(hp)} / {maxHp}</span>
        </div>
      </div>

      {/* Center: location + timer */}
      <div className={s.runInfo}>
        <span
          className={s.runTitle}
          style={locTheme ? { cursor: 'help' } : undefined}
          onMouseEnter={e => locTheme && setLocTipPos({ x: e.clientX + 16, y: e.clientY + 16 })}
          onMouseMove={e  => locTheme && setLocTipPos({ x: e.clientX + 16, y: e.clientY + 16 })}
          onMouseLeave={() => setLocTipPos(null)}
        >{locName}</span>
        <span className={[s.timer, isUrgent ? s.urgent : ''].join(' ')}>{fmtTime(remaining)}</span>
      </div>

      {/* Right: action buttons */}
      <ActionBar canLevel={canLevel} />
    </header>

    {locTipPos && locTheme && createPortal(
      <div className={s.locTooltip} style={{ left: locTipPos.x, top: locTipPos.y }}>
        <div className={s.locTooltipTheme} style={{ color: locTheme.color }}>
          {locTheme.displayLabel}
        </div>
        <div className={s.locTooltipDesc}>
          {(t.ui as Record<string, string>).mult_theme_desc ?? '+20% damage when content matches the theme.'}
        </div>
        {(locTheme.contentFocus.length > 0 || locTheme.stageFocus.length > 0) && (
          <div className={s.locTooltipSection}>
            <div className={s.locTooltipSectionLabel}>Favored (+20%)</div>
            <div className={s.locTooltipChips}>
              {locTheme.contentFocus.map(ct => (
                <span key={ct} className={s.locTooltipChip} style={{ borderColor: `${locTheme.color}55`, color: locTheme.color }}>
                  {(t.content.product as Record<string, { badge_label: string }>)[ct]?.badge_label ?? ct}
                </span>
              ))}
              {locTheme.stageFocus.map(st => (
                <span key={st} className={s.locTooltipChip} style={{ borderColor: `${locTheme.color}55`, color: locTheme.color }}>
                  {(t.content.stage as Record<string, { badge_label: string }>)[st]?.badge_label ?? st}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>,
      document.body,
    )}
    </>
  )
}
