import type { CSSProperties } from 'react'
import type { ContentEntry } from '../../data/contentDescriptions'
import s from './InfoTooltip.module.css'

interface Props {
  entry: ContentEntry
  style?: CSSProperties
  className?: string
}

/**
 * Renders the `entry.label` inline. On hover, shows a floating panel with
 * `entry.detail` and `entry.example`.
 */
export default function InfoTooltip({ entry, style, className }: Props) {
  return (
    <span className={`${s.wrap} ${className ?? ''}`} style={style}>
      {entry.label}
      <span className={s.popup} role="tooltip">
        <span className={s.detail}>{entry.detail}</span>
        <span className={s.example}>e.g. {entry.example}</span>
      </span>
    </span>
  )
}
