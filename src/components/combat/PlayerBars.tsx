import s from './PlayerBars.module.css'

interface Props {
  hp: number; maxHp: number
  estus?: number
}

function Bar({ pct, kind }: { pct: number; kind: string }) {
  return (
    <div className={s.bar}>
      <div className={`${s.fill} ${kind}`} style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%` }} />
    </div>
  )
}

export default function PlayerBars({ hp, maxHp }: Props) {
  return (
    <div className={s.root}>
      <div className={s.row}>
        <span className={s.label}>HP</span>
        <Bar pct={hp / maxHp} kind={s.fillHp} />
        <span className={s.val}>{hp}/{maxHp}</span>
      </div>
    </div>
  )
}
