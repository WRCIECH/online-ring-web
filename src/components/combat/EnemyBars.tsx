import s from './EnemyBars.module.css'

interface Props {
  name: string
  hp: number; maxHp: number
  poise?: number; maxPoise?: number
}

export default function EnemyBars({ name, hp, maxHp }: Props) {
  return (
    <div className={s.root}>
      <div className={s.name}>{name}</div>
      <div className={s.row}>
        <span className={s.label}>HP</span>
        <div className={s.bar}>
          <div className={`${s.fill} ${s.fillHp}`} style={{ width: `${Math.max(0, hp / maxHp * 100)}%` }} />
        </div>
        <span className={s.val}>{hp}/{maxHp}</span>
      </div>
    </div>
  )
}
