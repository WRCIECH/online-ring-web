import s from './PlayerBars.module.css'

interface Props {
  hp: number; maxHp: number
  stamina: number; maxStamina: number
  fp: number; maxFp: number
  estus?: number
}

function Bar({ pct, kind }: { pct: number; kind: string }) {
  return (
    <div className={s.bar}>
      <div className={`${s.fill} ${kind}`} style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%` }} />
    </div>
  )
}

export default function PlayerBars({ hp, maxHp, stamina, maxStamina, fp, maxFp }: Props) {
  return (
    <div className={s.root}>
      <div className={s.row}>
        <span className={s.label}>HP</span>
        <Bar pct={hp / maxHp} kind={s.fillHp} />
        <span className={s.val}>{hp}/{maxHp}</span>
      </div>
      <div className={s.row}>
        <span className={s.label}>STA</span>
        <Bar pct={stamina / maxStamina} kind={s.fillSta} />
        <span className={s.val}>{stamina}/{maxStamina}</span>
      </div>
      <div className={s.row}>
        <span className={s.label}>FP</span>
        <Bar pct={fp / maxFp} kind={s.fillFp} />
        <span className={s.val}>{fp}/{maxFp}</span>
      </div>
    </div>
  )
}
