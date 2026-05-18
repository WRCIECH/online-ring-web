import { useNavigate } from 'react-router-dom'
import s from './LocationSelectScreen.module.css'

interface Location {
  name: string
  subtitle: string
  unlocked: boolean
  scene: React.ReactElement
}

// ── SVG scenes (200 × 120 viewBox) ────────────────────────────────────────

const LOCATIONS: Location[] = [
  {
    name: 'Limgrave', subtitle: 'The First Step', unlocked: true,
    scene: (
      <g>
        <rect width="200" height="120" fill="#080f0a"/>
        <rect x="30" y="0" width="140" height="55" rx="55" fill="rgba(200,160,20,0.07)"/>
        <path d="M0,85 Q50,55 100,70 Q150,52 200,62 L200,120 L0,120Z" fill="#112218"/>
        <path d="M0,95 Q60,78 120,88 Q165,78 200,84 L200,120 L0,120Z" fill="#0c1a11"/>
        <line x1="100" y1="58" x2="100" y2="85" stroke="#ccaa22" strokeWidth="1.5" opacity="0.35"/>
        <path d="M88,66 Q100,52 112,66" fill="none" stroke="#ccaa22" strokeWidth="1" opacity="0.22"/>
        <circle cx="30" cy="14" r="0.9" fill="#ccaa22" opacity="0.6"/>
        <circle cx="60" cy="8" r="0.7" fill="#ccaa22" opacity="0.5"/>
        <circle cx="150" cy="11" r="0.9" fill="#ccaa22" opacity="0.6"/>
        <circle cx="180" cy="20" r="0.7" fill="#ccaa22" opacity="0.5"/>
        <circle cx="190" cy="8" r="0.8" fill="#ccaa22" opacity="0.4"/>
        <circle cx="12" cy="22" r="0.6" fill="#ccaa22" opacity="0.4"/>
      </g>
    ),
  },
  {
    name: 'Weeping Peninsula', subtitle: 'Southern Reaches', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#080a0c"/>
        {([20,38,56,74,92,112,132,152,172] as number[]).map((x, i) => (
          <line key={i} x1={x} y1={0} x2={x - 8} y2={32} stroke="#1e2530" strokeWidth="0.7" opacity="0.5"/>
        ))}
        <rect x="0" y="52" width="68" height="68" fill="#0e1216"/>
        <rect x="132" y="42" width="68" height="78" fill="#0c1014"/>
        <rect x="0" y="88" width="200" height="32" fill="#080c16" opacity="0.9"/>
        <rect x="90" y="28" width="8" height="58" rx="1" fill="#18191e"/>
        <rect x="86" y="26" width="16" height="8" rx="1" fill="rgba(190,210,255,0.45)"/>
        <circle cx="94" cy="30" r="8" fill="rgba(190,210,255,0.08)"/>
        <path d="M94,30 L155,58" stroke="rgba(190,210,255,0.06)" strokeWidth="14"/>
      </g>
    ),
  },
  {
    name: 'Liurnia of the Lakes', subtitle: 'The Flooded Realm', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#060910"/>
        <rect x="0" y="72" width="200" height="48" fill="#080c18"/>
        <path d="M0,76 Q25,72 50,76 Q80,80 110,75 Q145,72 175,76 Q190,78 200,75" fill="none" stroke="rgba(70,110,180,0.22)" strokeWidth="1"/>
        <path d="M18,72 L18,48 Q34,32 50,48 L50,72" fill="none" stroke="#162038" strokeWidth="2"/>
        <path d="M62,72 L62,56 Q72,46 82,56 L82,72" fill="none" stroke="#122030" strokeWidth="1.5"/>
        <polygon points="145,12 152,72 138,72" fill="#12184a"/>
        <rect x="136" y="12" width="18" height="4" fill="#18204e"/>
        <circle cx="145" cy="9" r="4" fill="rgba(60,80,200,0.4)"/>
        <rect x="0" y="62" width="200" height="16" fill="rgba(50,70,140,0.06)"/>
        <circle cx="28" cy="14" r="0.8" fill="#7788cc" opacity="0.5"/>
        <circle cx="82" cy="9" r="0.7" fill="#7788cc" opacity="0.4"/>
        <circle cx="172" cy="18" r="0.9" fill="#7788cc" opacity="0.5"/>
      </g>
    ),
  },
  {
    name: 'Caelid', subtitle: 'The Scarred Land', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#0d0404"/>
        <rect x="40" y="0" width="120" height="55" rx="55" fill="rgba(170,18,8,0.1)"/>
        <rect x="0" y="72" width="200" height="48" fill="#100606"/>
        <path d="M18,78 L38,88 L24,100" fill="none" stroke="#1e0808" strokeWidth="1"/>
        <path d="M80,75 L108,90 L94,108" fill="none" stroke="#1e0808" strokeWidth="1"/>
        <path d="M148,80 L168,86 L154,96" fill="none" stroke="#1e0808" strokeWidth="1"/>
        <line x1="35" y1="72" x2="35" y2="38" stroke="#180a0a" strokeWidth="2.5"/>
        <line x1="35" y1="54" x2="20" y2="42" stroke="#180a0a" strokeWidth="1.5"/>
        <line x1="35" y1="46" x2="50" y2="38" stroke="#180a0a" strokeWidth="1.5"/>
        <line x1="140" y1="72" x2="140" y2="33" stroke="#180a0a" strokeWidth="2.5"/>
        <line x1="140" y1="48" x2="125" y2="36" stroke="#180a0a" strokeWidth="1.5"/>
        <line x1="140" y1="40" x2="156" y2="33" stroke="#180a0a" strokeWidth="1.5"/>
        <circle cx="60" cy="78" r="6" fill="rgba(170,18,8,0.15)"/>
        <circle cx="118" cy="82" r="8" fill="rgba(170,18,8,0.12)"/>
        <circle cx="172" cy="86" r="5" fill="rgba(170,18,8,0.1)"/>
      </g>
    ),
  },
  {
    name: 'Altus Plateau', subtitle: 'The Golden Gate', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#0e0b02"/>
        <rect x="20" y="0" width="160" height="70" rx="70" fill="rgba(195,125,8,0.08)"/>
        <rect x="0" y="58" width="200" height="62" fill="#18120a"/>
        <rect x="68" y="28" width="64" height="30" fill="#120e06"/>
        <rect x="58" y="42" width="10" height="16" fill="#100c04"/>
        <rect x="132" y="42" width="10" height="16" fill="#100c04"/>
        {([68,78,88,98,108,118,128] as number[]).map((x, i) => (
          <rect key={i} x={x} y="26" width="6" height="4" fill="#0e0a04"/>
        ))}
        <path d="M93,58 L93,44 Q100,38 107,44 L107,58" fill="#0a0802"/>
        <circle cx="100" cy="14" r="20" fill="rgba(195,155,18,0.07)"/>
      </g>
    ),
  },
  {
    name: 'Mt. Gelmir', subtitle: 'The Volcanic Depths', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#0a0602"/>
        <rect x="30" y="0" width="140" height="48" rx="40" fill="rgba(175,55,8,0.12)"/>
        <polygon points="100,8 162,90 38,90" fill="#100c08"/>
        <path d="M95,38 Q90,52 85,68 Q82,78 88,90" fill="none" stroke="rgba(215,75,8,0.4)" strokeWidth="2"/>
        <path d="M106,48 Q112,63 109,78 Q107,86 114,90" fill="none" stroke="rgba(215,75,8,0.3)" strokeWidth="1.5"/>
        <path d="M38,90 Q68,82 100,86 Q132,82 162,90" fill="rgba(195,65,8,0.18)"/>
        <rect x="0" y="90" width="200" height="30" fill="#0c0804"/>
        {([[48,28],[78,18],[130,23],[158,33]] as [number,number][]).map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={1.2} fill="#3e1c10" opacity="0.5"/>
        ))}
      </g>
    ),
  },
  {
    name: 'Leyndell', subtitle: 'The Royal Capital', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#0d0b02"/>
        <rect x="15" y="0" width="170" height="68" rx="58" fill="rgba(195,155,18,0.09)"/>
        <rect x="8" y="48" width="22" height="72" fill="#181404"/>
        <rect x="33" y="38" width="16" height="82" fill="#1c1806"/>
        <rect x="52" y="33" width="26" height="87" fill="#1e1c06"/>
        <rect x="83" y="42" width="34" height="78" fill="#201e08"/>
        <path d="M83,42 Q100,26 117,42" fill="#201e08"/>
        <circle cx="100" cy="32" r="5" fill="rgba(200,160,20,0.35)"/>
        <rect x="120" y="36" width="22" height="84" fill="#1c1806"/>
        <rect x="145" y="46" width="16" height="74" fill="#181404"/>
        <rect x="164" y="54" width="28" height="66" fill="#141202"/>
        <line x1="41" y1="38" x2="41" y2="25" stroke="#ccaa22" strokeWidth="1" opacity="0.28"/>
        <line x1="100" y1="27" x2="100" y2="12" stroke="#ccaa22" strokeWidth="1.5" opacity="0.38"/>
        <line x1="131" y1="36" x2="131" y2="22" stroke="#ccaa22" strokeWidth="1" opacity="0.28"/>
      </g>
    ),
  },
  {
    name: 'Mountaintops of the Giants', subtitle: 'The Frozen Heights', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#060810"/>
        <polygon points="48,18 88,82 8,82" fill="#0c1018"/>
        <polygon points="100,4 148,76 52,76" fill="#10161e"/>
        <polygon points="157,22 192,82 122,82" fill="#0c1018"/>
        <polygon points="48,18 60,42 36,42" fill="rgba(175,195,220,0.22)"/>
        <polygon points="100,4 114,30 86,30" fill="rgba(175,195,220,0.28)"/>
        <polygon points="157,22 168,45 146,45" fill="rgba(175,195,220,0.18)"/>
        <rect x="0" y="82" width="200" height="38" fill="#080c14"/>
        <rect x="0" y="82" width="200" height="5" fill="rgba(155,180,210,0.14)"/>
        {([[24,9],[74,7],[128,11],[170,5],[186,17]] as [number,number][]).map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={0.9} fill="#aabbdd" opacity="0.5"/>
        ))}
        {([30,60,95,130,165,195] as number[]).map((x, i) => (
          <line key={i} x1={x} y1={44} x2={x - 12} y2={52} stroke="rgba(148,175,210,0.11)" strokeWidth="1.5"/>
        ))}
      </g>
    ),
  },
  {
    name: 'Consecrated Snowfield', subtitle: 'The Hidden Realm', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#090b10"/>
        <rect x="0" y="0" width="200" height="120" fill="rgba(155,170,198,0.04)"/>
        <rect x="0" y="18" width="200" height="38" fill="rgba(165,180,205,0.05)"/>
        <rect x="0" y="48" width="200" height="28" fill="rgba(155,170,198,0.05)"/>
        <circle cx="100" cy="62" r="50" fill="rgba(198,178,98,0.04)"/>
        <circle cx="100" cy="62" r="24" fill="rgba(198,178,98,0.05)"/>
        {([[18,28],[48,14],[78,44],[118,19],[152,34],[174,11],[38,64],[98,54],[158,60],[84,80]] as [number,number][]).map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={0.7} fill="rgba(198,212,234,0.5)" opacity="0.5"/>
        ))}
        <rect x="0" y="95" width="200" height="25" fill="rgba(128,148,180,0.07)"/>
        <path d="M0,38 Q48,34 98,40 Q148,45 200,38" fill="none" stroke="rgba(178,192,220,0.06)" strokeWidth="1.5"/>
        <path d="M0,58 Q58,54 108,60 Q158,65 200,58" fill="none" stroke="rgba(178,192,220,0.05)" strokeWidth="1"/>
      </g>
    ),
  },
  {
    name: 'Nokron', subtitle: 'The Eternal City', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#040208"/>
        <path d="M0,0 Q48,14 100,7 Q152,17 200,4 L200,0 L0,0Z" fill="#07050e"/>
        {([[18,9],[44,5],[70,13],[96,8],[122,6],[148,11],[174,7]] as [number,number][]).map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={1.2} fill="#6644cc" opacity="0.5"/>
        ))}
        {([[34,15],[84,17],[130,14],[164,16]] as [number,number][]).map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={0.7} fill="#8866ee" opacity="0.4"/>
        ))}
        <rect x="18" y="28" width="8" height="92" fill="#0c0a16"/>
        <rect x="14" y="26" width="16" height="4" fill="#101018"/>
        <rect x="70" y="38" width="8" height="82" fill="#0a0814"/>
        <rect x="66" y="36" width="16" height="4" fill="#100e1a"/>
        <rect x="122" y="32" width="8" height="88" fill="#0c0a16"/>
        <rect x="118" y="30" width="16" height="4" fill="#100e1a"/>
        <rect x="174" y="40" width="8" height="80" fill="#0a0814"/>
        <rect x="0" y="100" width="200" height="20" fill="#060414"/>
        <path d="M92,7 L82,100" stroke="rgba(98,68,198,0.06)" strokeWidth="22"/>
        <path d="M44,5 L36,100" stroke="rgba(78,58,178,0.05)" strokeWidth="15"/>
      </g>
    ),
  },
  {
    name: 'Siofra River', subtitle: 'The Ancient Depths', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#020610"/>
        <rect x="0" y="0" width="200" height="18" fill="rgba(18,38,98,0.28)"/>
        <rect x="0" y="62" width="200" height="58" fill="#030810"/>
        <rect x="38" y="66" width="124" height="14" fill="rgba(18,78,158,0.28)"/>
        <path d="M38,70 Q100,66 162,70" fill="none" stroke="rgba(38,118,200,0.2)" strokeWidth="1"/>
        <rect x="12" y="18" width="6" height="82" fill="#080c18"/>
        <rect x="48" y="28" width="5" height="72" fill="#060a14"/>
        <rect x="147" y="22" width="5" height="78" fill="#060a14"/>
        <rect x="182" y="18" width="6" height="82" fill="#080c18"/>
        {([[28,58],[74,53],[126,53],[172,58]] as [number,number][]).map(([x,y],i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={4} ry={6} fill="rgba(18,158,220,0.24)"/>
            <ellipse cx={x} cy={y + 2} rx={2} ry={3} fill="rgba(38,198,255,0.28)"/>
          </g>
        ))}
        <path d="M38,4 Q100,0 162,4" stroke="rgba(18,98,200,0.08)" strokeWidth="8"/>
      </g>
    ),
  },
  {
    name: 'Crumbling Farum Azula', subtitle: 'The Shattered Citadel', unlocked: false,
    scene: (
      <g>
        <rect width="200" height="120" fill="#08060e"/>
        <rect x="0" y="0" width="200" height="68" fill="rgba(58,28,78,0.14)"/>
        <path d="M0,28 Q48,16 100,26 Q152,16 200,23 L200,0 L0,0Z" fill="rgba(38,18,58,0.28)"/>
        <rect x="8" y="43" width="42" height="18" rx="1" fill="#141018"/>
        <rect x="20" y="33" width="18" height="12" fill="#121018"/>
        <rect x="78" y="33" width="52" height="22" rx="1" fill="#171420"/>
        <rect x="88" y="23" width="32" height="12" fill="#141018"/>
        <rect x="148" y="46" width="36" height="16" rx="1" fill="#141018"/>
        {([[53,53],[58,40],[70,48],[134,36],[142,56],[160,33]] as [number,number][]).map(([x,y],i) => (
          <rect key={i} x={x} y={y} width={3} height={3} rx={0.5} fill="#1c1628" opacity="0.7"/>
        ))}
        <path d="M100,4 L94,22 L103,26 L92,48" fill="none" stroke="rgba(178,138,255,0.24)" strokeWidth="1.5"/>
        <rect x="78" y="33" width="52" height="22" fill="rgba(178,98,18,0.06)"/>
      </g>
    ),
  },
]

// ── Lock icon SVG ──────────────────────────────────────────────────────────

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

// ── Screen ─────────────────────────────────────────────────────────────────

export default function LocationSelectScreen() {
  const navigate = useNavigate()

  function handleSelect(loc: Location) {
    if (!loc.unlocked) return
    navigate('/weapons', { state: { locationName: loc.name } })
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>Choose Your Dungeon</h1>
        <p className={s.subtitle}>Select a region to begin your 48-hour sprint</p>
      </div>

      <div className={s.grid}>
        {LOCATIONS.map(loc => (
          <button
            key={loc.name}
            className={[s.card, loc.unlocked ? s.cardUnlocked : s.cardLocked].join(' ')}
            onClick={() => handleSelect(loc)}
          >
            {/* Illustration */}
            <div className={s.illustration}>
              <svg viewBox="0 0 200 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                {loc.scene}
              </svg>
              {!loc.unlocked && (
                <div className={s.lockOverlay}>
                  <LockIcon />
                </div>
              )}
              {loc.unlocked && <div className={s.availableBadge}>Available</div>}
            </div>

            {/* Card info */}
            <div className={s.info}>
              <div className={s.name}>{loc.name}</div>
              <div className={s.locationSubtitle}>{loc.subtitle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
