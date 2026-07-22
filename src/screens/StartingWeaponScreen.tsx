import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { rollWeapon } from '../data/generators/weaponGenerator'
import { WEAPON_CLASSES } from '../data/generators/weaponClasses'
import { LEVEL_MULT } from '../data/weapons'
import type { WeaponClass, WeaponInstance } from '../types/game'
import WeaponSprite from '../components/icons/WeaponSprite'
import HomeLogo from '../components/HomeLogo'
import s from './StartingWeaponScreen.module.css'

// One candidate class from each weight tier — always obviously different
const WEIGHT_GROUPS: WeaponClass[][] = [
  ['daggers', 'fists', 'bows', 'thrusting_swords', 'torches'],
  ['straight_swords', 'katanas', 'spears', 'axes', 'curved_swords',
   'heavy_thrusting', 'halberds', 'whips', 'twinblades', 'crossbows'],
  ['greatswords', 'hammers', 'great_hammers', 'great_axes', 'curved_greatswords',
   'flails', 'reapers', 'great_spears', 'colossal_swords', 'greatbows', 'ballistas'],
]

function poiseColour(n: number): string {
  if (n <= 5)  return '#2ecc88'
  if (n <= 10) return '#ccaa22'
  if (n <= 16) return '#cc6622'
  return '#cc3333'
}

function poiseLabel(n: number): string {
  if (n <= 5)  return 'Light — fast, frequent strikes'
  if (n <= 10) return 'Medium — balanced approach'
  if (n <= 16) return 'Heavy — slow, powerful blows'
  return 'Colossal — immense, infrequent blows'
}


function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function StartingWeaponScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()

  // Generate once on mount — one weapon per weight tier
  const [options] = useState<WeaponInstance[]>(() =>
    WEIGHT_GROUPS.map(group => rollWeapon(pickOne(group), 'common') as WeaponInstance)
  )

  const [chosen, setChosen] = useState<number | null>(null)

  function handleConfirm() {
    if (chosen === null) return
    store.initClass('chronicler') // legacy screen no longer active — replaced by ClassSelectScreen
    navigate('/locations')
  }

  return (
    <div className={s.root}>
      <div className={s.homeLogoWrap}><HomeLogo /></div>
      <div className={s.header}>
        <h1 className={s.title}>Choose Your Weapon</h1>
        <p className={s.subtitle}>Your weapon defines your creative identity for this journey</p>
      </div>

      <div className={s.cards}>
        {options.map((w, i) => {
          const cls        = WEAPON_CLASSES[w.weapon_class]
          const isChosen   = chosen === i
          const poiseWeight = w.poise_weight ?? 8
          const colour     = poiseColour(poiseWeight)

          return (
            <button
              key={i}
              className={[s.card, isChosen ? s.cardChosen : ''].join(' ')}
              onClick={() => setChosen(i)}
              style={isChosen ? { '--card-glow': colour } as React.CSSProperties : undefined}
            >
              {/* Sprite area */}
              <div className={s.spriteWrap} style={{ background: `radial-gradient(ellipse at center, ${colour}18 0%, transparent 70%)` }}>
                <WeaponSprite
                  weaponClass={w.weapon_class}
                  rarity={w.rarity}
                  poiseWeight={poiseWeight}
                  size={110}
                />
              </div>

              {/* Info */}
              <div className={s.info}>
                <div className={s.weaponName}>{w.name}</div>
                <div className={s.className}>{cls.name}</div>

                <div className={s.weightBadge} style={{ color: colour, borderColor: `${colour}55` }}>
                  {poiseLabel(poiseWeight)}
                </div>

                <p className={s.desc}>{w.description}</p>

                <div className={s.stats}>
                  <span className={s.levelBonus}>
                    +{((LEVEL_MULT[w.rarity] ?? 0.03) * 100).toFixed(0)}% dmg per level
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className={s.footer}>
        <button
          className={s.btnConfirm}
          disabled={chosen === null}
          onClick={handleConfirm}
        >
          {chosen !== null
            ? `Wield the ${options[chosen].name}`
            : 'Select a weapon'}
        </button>
      </div>
    </div>
  )
}
