import { useEffect, useRef, useState } from 'react'
import s from './CombatMusic.module.css'

// Minimal YT player interface — avoids adding @types/youtube as a dependency
interface YTPlayer {
  loadVideoById(videoId: string): void
  playVideo(): void
  mute(): void
  unMute(): void
  destroy(): void
}

// ── YouTube IFrame API singleton loader ───────────────────────────────────────
// The YT API calls window.onYouTubeIframeAPIReady when ready, so we chain
// onto it without clobbering any existing handler.

let _loaded = false
let _ready  = false
const _queue: Array<() => void> = []

function loadYTApi(): Promise<void> {
  if (_ready) return Promise.resolve()
  return new Promise(resolve => {
    _queue.push(resolve)
    if (_loaded) return
    _loaded = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prev = (window as any).onYouTubeIframeAPIReady as (() => void) | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).onYouTubeIframeAPIReady = () => {
      _ready = true
      _queue.forEach(fn => fn())
      _queue.length = 0
      prev?.()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  videoId:      string | undefined
  label:        string
  muted:        boolean
  onToggleMute: () => void
}

export default function CombatMusic({ videoId, label, muted, onToggleMute }: Props) {
  const playerId  = useRef(`yt-${Math.random().toString(36).slice(2, 8)}`).current
  const playerRef = useRef<YTPlayer | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [collapsed,   setCollapsed]   = useState(false)

  // Create the YT player once on mount; destroy on unmount.
  useEffect(() => {
    if (!videoId) return
    let dead = false

    loadYTApi().then(() => {
      if (dead) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerRef.current = new (window as any).YT.Player(playerId, {
        height: '113',
        width:  '200',
        videoId,
        playerVars: {
          autoplay:       1,
          controls:       0,
          modestbranding: 1,
          rel:            0,
          iv_load_policy: 3,
          playsinline:    1,
        },
        events: {
          onReady: () => {
            if (dead) return
            if (muted) playerRef.current?.mute()
            setPlayerReady(true)
          },
          onStateChange: (e: { data: number }) => {
            // Restart when the video ends (state 0 = ended)
            if (e.data === 0) playerRef.current?.playVideo()
          },
        },
      })
    })

    return () => {
      dead = true
      playerRef.current?.destroy()
      playerRef.current = null
      setPlayerReady(false)
    }
  }, []) // intentionally mount-only; videoId switches handled below

  // Switch track when the enemy changes
  useEffect(() => {
    if (!playerReady || !videoId) return
    playerRef.current?.loadVideoById(videoId)
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync mute state whenever parent toggles it
  useEffect(() => {
    if (!playerReady) return
    if (muted) playerRef.current?.mute()
    else       playerRef.current?.unMute()
  }, [muted, playerReady])

  if (!videoId) return null

  return (
    <div className={`${s.widget} ${collapsed ? s.collapsed : ''}`}>
      <div className={s.bar}>
        <span className={s.noteIcon}>♪</span>
        <span className={s.label}>{label}</span>
        <button
          className={s.btnMute}
          onClick={onToggleMute}
          title={muted ? 'Unmute music' : 'Mute music'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button
          className={s.btnToggle}
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Show player' : 'Hide player'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>
      {/* The iframe must remain in the DOM and visible for audio to keep playing.
          Collapsing sets height to 0 which will pause audio — the mute button
          is the intended way to silence without stopping playback. */}
      <div className={s.playerWrap}>
        <div id={playerId} />
      </div>
    </div>
  )
}
