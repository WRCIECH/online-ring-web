import { Fragment, useMemo } from 'react'
import type { WeaponInstance } from '../../types/game'
import { describeWeaponPattern, type PatternNode, type DrawNode } from '../../data/weaponStructure'
import { STAGE_COLOR } from '../../data/tileBadges'
import { useT, type TranslationBundle } from '../../i18n'
import s from './WeaponStructurePreview.module.css'

interface Props {
  weapon: WeaponInstance
}

function fmtMin(secs: number): string {
  return `${Math.round(secs / 60)}m`
}

const DRAW_LABEL_KEY: Record<DrawNode['label'], string> = {
  format: 'draw_format',
  transformation: 'draw_transformation',
  style: 'draw_style',
  emotion: 'draw_emotion',
}

// Buckets that resolve a draw node's concrete value to its localized
// badge_label — keyed the same way DrawNode['label'] is.
const VALUE_BUCKET: Record<DrawNode['label'], keyof TranslationBundle['content']> = {
  format: 'product',
  transformation: 'origin',
  style: 'dmg_type',
  emotion: 'status',
}

function renderNode(node: PatternNode, key: string, t: TranslationBundle) {
  if (node.kind === 'phase') {
    const countLabel = node.min === node.max ? `×${node.min}` : `×${node.min}–${node.max}`
    return (
      <div key={key} className={s.phaseChip} style={{ borderColor: STAGE_COLOR[node.stage] }}>
        <span className={s.phaseStage} style={{ color: STAGE_COLOR[node.stage] }}>
          {t.content.stage[node.stage]?.badge_label ?? node.stage}
        </span>
        <span className={s.phaseCount}>{countLabel}</span>
        <span className={s.phaseTime}>{fmtMin(node.lightSec)} / {fmtMin(node.heavySec)}</span>
      </div>
    )
  }

  if (node.kind === 'draw') {
    const pctLabel = node.probability < 1 ? ` ${Math.round(node.probability * 100)}%` : ''
    const bucket = t.content[VALUE_BUCKET[node.label]] as Record<string, { badge_label: string }>
    const resolvedLabel = node.value !== null ? bucket[node.value]?.badge_label : undefined
    const isInactive = node.value === null
    return (
      <div key={key} className={[s.drawChip, isInactive ? s.drawChipInactive : ''].join(' ')}>
        + {t.ui[DRAW_LABEL_KEY[node.label]] ?? node.label}{pctLabel}
        {resolvedLabel ? ` — ${resolvedLabel}` : ''}
      </div>
    )
  }

  return (
    <div key={key} className={s.branchBox}>
      {node.paths.map((path, i) => (
        <div key={i} className={s.branchLane}>
          {path.map((n, j) => (
            <Fragment key={j}>
              {renderNode(n, `${i}-${j}`, t)}
              {j < path.length - 1 && <span className={s.arrow}>→</span>}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function WeaponStructurePreview({ weapon }: Props) {
  const t = useT()
  const nodes = useMemo(() => describeWeaponPattern(weapon), [weapon])

  return (
    <div className={s.scroller}>
      <div className={s.flow}>
        {nodes.map((n, i) => (
          <Fragment key={i}>
            {renderNode(n, String(i), t)}
            {i < nodes.length - 1 && <span className={s.arrow}>→</span>}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
