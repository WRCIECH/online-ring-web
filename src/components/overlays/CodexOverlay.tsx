import { useState } from 'react'
import { ContentRegistry } from '../../data/contentProducts'
import { STAGE_TIME } from '../../data/generators/workflowGenerator'
import { WEAPON_CLASSES, ALL_WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import WeaponIcon from '../WeaponIcon'
import {
  HEAVY_TIME_BONUS, FINISHER_MULT,
  FLOW_MULT_HOT, FLOW_MULT_WARM, FLOW_GAP_HOT_MINS, FLOW_GAP_WARM_MINS,
  CAMPAIGN_PENALTY_BASE, END_MITIGATION_PER_POINT, CAMPAIGN_PENALTY_CAP,
  ABANDON_PENALTY, REPEAT_DAMAGE_PENALTY, REPEAT_PENALTY_PER_RETRY, REPEAT_PENALTY_MAX,
} from '../../data/constants'
import { useT } from '../../i18n'
import type { ContentTransformation } from '../../types/game'
import s from './CodexOverlay.module.css'

type Tab = 'formats' | 'transformations' | 'stages' | 'multipliers' | 'weapons'

const CATEGORY_ORDER = ['Text', 'Visual', 'Audio', 'Video', 'Hybrid', 'Exotic'] as const

const TRANSFORMATION_KEYS: ContentTransformation[] = [
  'Compression', 'Expansion', 'ZoomIn', 'ZoomOut', 'Similar', 'Opposite',
  'Minimalism', 'Shock', 'Narration', 'Segmentation', 'Fast', 'Passion', 'Intellectual',
  'ProblemSolving', 'Estetic', 'Interactive', 'Cliffhanger', 'Viral', 'Controversy',
  'Comfort', 'Drama', 'Humor', 'Parasocial', 'Wow', 'Hope', 'Fear', 'Desire',
  'Critique', 'Follows', 'AudienceShift', 'DomainTransfer', 'Synthesis', 'RemixFusion',
  'Split', 'Evidence', 'Simplify', 'Technicalize', 'Localize', 'Socratic',
  'Analogy', 'FirstPrinciples', 'DataDriven',
]

const STAGE_KEYS = ['Research', 'Produce'] as const

const BONUS_MULTS = [
  { key: 'mult_heavyBonus',   value: `+${Math.round((HEAVY_TIME_BONUS - 1) * 100)}%` },
  { key: 'mult_flow',         value: `+${Math.round((FLOW_MULT_HOT - 1) * 100)}% / +${Math.round((FLOW_MULT_WARM - 1) * 100)}%` },
  { key: 'mult_streak',       value: '+5% / tile (cap +50%)' },
  { key: 'mult_theme',        value: '+20%' },
  { key: 'mult_campaignDone', value: '+5% / cycle' },
  { key: 'mult_bonusPool',    value: 'additive' },
  { key: 'mult_finisher',     value: `×${FINISHER_MULT}` },
  { key: 'mult_affinity',     value: '×2 / ×1.5 / ×0.7 / ×0.5' },
] as const

const PENALTY_MULTS = [
  { key: 'mult_repeatFlat',    value: `−${Math.round(REPEAT_DAMAGE_PENALTY * 100)}%` },
  { key: 'mult_repeatScaling', value: `−${Math.round(REPEAT_PENALTY_PER_RETRY * 100)}% / try (cap −${Math.round(REPEAT_PENALTY_MAX * 100)}%)` },
  { key: 'mult_abandon',       value: `−${Math.round(ABANDON_PENALTY * 100)}%` },
  { key: 'mult_campaignOverload', value: `−${Math.round(CAMPAIGN_PENALTY_BASE * 100)}% / campaign (cap −${Math.round(CAMPAIGN_PENALTY_CAP * 100)}%)` },
] as const

interface Props { onClose: () => void }

export default function CodexOverlay({ onClose }: Props) {
  const t = useT()
  const [tab, setTab] = useState<Tab>('formats')
  const ui = t.ui as Record<string, string>

  const productsByCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    items: Object.values(ContentRegistry.Products).filter(p => p.category === cat),
  })).filter(g => g.items.length > 0)

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>
        <div className={s.header}>
          <span className={s.title}>{ui.btn_codex ?? 'Kodeks'}</span>
          <button className={s.btnClose} onClick={onClose}>✕</button>
        </div>

        <div className={s.tabs}>
          {(['formats', 'transformations', 'stages', 'multipliers', 'weapons'] as Tab[]).map(k => (
            <button
              key={k}
              className={[s.tabBtn, tab === k ? s.tabBtnActive : ''].filter(Boolean).join(' ')}
              onClick={() => setTab(k)}
            >
              {ui[`codex_tab_${k}`] ?? k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        <div className={s.body}>
          {/* ── FORMATS ── */}
          {tab === 'formats' && (
            <div className={s.listWrap}>
              {productsByCategory.map(({ cat, items }) => (
                <div key={cat} className={s.group}>
                  <div className={s.groupHeader}>{cat}</div>
                  {items.map(p => (
                    <div key={p.id} className={s.entry}>
                      <div className={s.entryTop}>
                        <span className={s.entryName}>{p.displayName}</span>
                        <span className={s.complexityDots}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < p.complexity ? s.dotFilled : s.dotEmpty}>●</span>
                          ))}
                        </span>
                      </div>
                      <div className={s.entryDesc}>{p.description}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ── TRANSFORMATIONS ── */}
          {tab === 'transformations' && (
            <div className={s.listWrap}>
              {TRANSFORMATION_KEYS.map(key => {
                const entry = (t.content.transformation as Record<string, { label: string; detail: string; example: string }>)[key]
                if (!entry) return null
                return (
                  <div key={key} className={s.entry}>
                    <div className={s.entryName}>{entry.label}</div>
                    <div className={s.entryDesc}>{entry.detail}</div>
                    <div className={s.entryExample}>{entry.example}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── STAGES ── */}
          {tab === 'stages' && (
            <div className={s.listWrap}>
              {STAGE_KEYS.map(key => {
                const entry = (t.content.stage as Record<string, { label: string; detail: string; example: string }>)[key]
                const times = STAGE_TIME[key]
                if (!entry) return null
                return (
                  <div key={key} className={s.entry}>
                    <div className={s.entryName}>{entry.label}</div>
                    <div className={s.entryDesc}>{entry.detail}</div>
                    <div className={s.entryExample}>{entry.example}</div>
                    <div className={s.stageTimes}>
                      <span className={s.timeChip}>Light {Math.round(times.light / 60)} min</span>
                      <span className={s.timeChip}>Heavy {Math.round(times.heavy / 60)} min</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── MULTIPLIERS ── */}
          {tab === 'multipliers' && (
            <div className={s.listWrap}>
              <div className={s.group}>
                <div className={s.groupHeader}>{ui.codex_bonuses ?? 'Bonuses'}</div>
                {BONUS_MULTS.map(({ key, value }) => (
                  <div key={key} className={s.entry}>
                    <div className={s.entryTop}>
                      <span className={s.entryName}>{ui[key] ?? key}</span>
                      <span className={s.multValue}>{value}</span>
                    </div>
                    <div className={s.entryDesc}>{ui[`${key}_desc`]}</div>
                    {key === 'mult_flow' && (
                      <div className={s.entryNote}>
                        {`< ${FLOW_GAP_HOT_MINS} min → +${Math.round((FLOW_MULT_HOT - 1) * 100)}% · < ${FLOW_GAP_WARM_MINS} min → +${Math.round((FLOW_MULT_WARM - 1) * 100)}%`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className={s.group}>
                <div className={s.groupHeaderPenalty}>{ui.codex_penalties ?? 'Penalties'}</div>
                {PENALTY_MULTS.map(({ key, value }) => (
                  <div key={key} className={s.entry}>
                    <div className={s.entryTop}>
                      <span className={s.entryName}>{ui[key] ?? key}</span>
                      <span className={s.multValuePenalty}>{value}</span>
                    </div>
                    <div className={s.entryDesc}>{ui[`${key}_desc`]}</div>
                    {key === 'mult_campaignOverload' && (
                      <div className={s.entryNote}>
                        {`${Math.round(END_MITIGATION_PER_POINT * 100 * 10) / 10}% mitigation per END point`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ── WEAPONS ── */}
          {tab === 'weapons' && (
            <div className={s.listWrap}>
              {ALL_WEAPON_CLASSES.map(wc => {
                const cls = WEAPON_CLASSES[wc]
                const wt = (t.weapons as Record<string, { name: string; description: string }>)[wc]
                const scalingEntries = Object.entries(cls.scaling)
                return (
                  <div key={wc} className={s.weaponEntry}>
                    <div className={s.weaponIcon}>
                      <WeaponIcon weaponClass={wc} className={s.weaponSvg} />
                    </div>
                    <div className={s.weaponInfo}>
                      <div className={s.entryTop}>
                        <span className={s.entryName}>{wt?.name ?? wc}</span>
                        <span className={s.poiseChip}>{cls.poise_weight}</span>
                        <span className={s.dmgChip}>×{cls.base_damage_mult}</span>
                      </div>
                      <div className={s.entryDesc}>{wt?.description}</div>
                      {scalingEntries.length > 0 && (
                        <div className={s.scalingRow}>
                          {scalingEntries.map(([stat, grade]) => (
                            <span key={stat} className={s.scalingChip}>{stat} {grade}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
