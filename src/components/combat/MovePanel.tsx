import type { MoveType, WorkflowTile } from '../../types/game'
import s from './MovePanel.module.css'

interface Props {
  tile: WorkflowTile | null
  playerEstus: number
  onMove:      (move: MoveType) => void
  onEstus:     () => void
  onAbandon:   () => void
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const sc = secs % 60
  return m > 0 ? (sc > 0 ? `${m}m ${sc}s` : `${m}m`) : `${sc}s`
}

export default function MovePanel({ tile, playerEstus, onMove, onEstus, onAbandon }: Props) {
  const hasTarget = !!tile

  return (
    <div className={s.panel}>
      {tile && (
        <div className={s.tileInfo}>
          <span className={s.tileType}>{tile.type}</span>
          <span className={s.tileName}>{tile.name}</span>
          {tile.is_completed && (
            <span className={s.repeatBadge}>repeat — −20% dmg</span>
          )}
        </div>
      )}

      {!tile && (
        <div className={s.hint}>Select a tile to choose your attack.</div>
      )}

      <div className={s.moves}>
        <button
          className={`${s.moveBtn} ${s.light}`}
          disabled={!hasTarget}
          onClick={() => onMove('Light')}
        >
          <span className={s.moveName}>Light</span>
          {tile && <span className={s.moveTime}>{fmtTime(tile.time_light)}</span>}
          <span className={s.moveDesc}>Less time, base reward</span>
        </button>

        <button
          className={`${s.moveBtn} ${s.heavy}`}
          disabled={!hasTarget}
          onClick={() => onMove('Heavy')}
        >
          <span className={s.moveName}>Heavy</span>
          {tile && <span className={s.moveTime}>{fmtTime(tile.time_heavy)}</span>}
          <span className={s.moveDesc}>More time, 1.5× reward</span>
        </button>

        <button
          className={`${s.moveBtn} ${s.jump}`}
          disabled={!hasTarget}
          onClick={() => onMove('Jump')}
          title="Jump over this tile to the next one — 0.8× reward"
        >
          <span className={s.moveName}>Jump</span>
          {tile && <span className={s.moveTime}>{fmtTime(Math.round((tile.time_light + tile.time_heavy) / 2))}</span>}
          <span className={s.moveDesc}>Quick work, 0.8× reward</span>
        </button>
      </div>

      <div className={s.actions}>
        <button
          className={s.estusBtn}
          disabled={playerEstus <= 0}
          onClick={onEstus}
        >
          🧪 Estus ({playerEstus})
        </button>
        <button
          className={s.abandonBtn}
          onClick={onAbandon}
        >
          Abandon workflow
        </button>
      </div>

    </div>
  )
}
