import type { WorkflowTile } from '../../types/game'
import s from './MovePanel.module.css'

interface Props {
  tile: WorkflowTile | null
  playerEstus: number
  onEstus:     () => void
  onAbandon:   () => void
}

export default function MovePanel({ tile, playerEstus, onEstus, onAbandon }: Props) {
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

      <div className={s.hint}>
        {tile ? 'Pick Light, Heavy, or Jump from the circle.' : 'Click a tile to choose your attack.'}
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
