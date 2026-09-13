import {
  WEAPON_BALANCE_WINDOW_DAYS,
  WEAPON_BALANCE_WARMUP_MINUTES_PER_WEAPON,
  WEAPON_BALANCE_SCALE,
  WEAPON_BALANCE_MIN_MULT,
  WEAPON_BALANCE_MAX_MULT,
} from '../data/constants'

export interface WeaponBalanceInfo {
  mult: number         // damage multiplier to apply (1.0 = neutral)
  ratio: number         // this weapon's share of total logged minutes in the window (0..1)
  idealShare: number    // 1 / activeWeaponCount
  minutes: number       // this weapon's minutes in the window
  totalMinutes: number  // sum across the whole active roster in the window
  warm: boolean         // false while there isn't enough data for the multiplier to mean anything
}

export function calcWeaponBalance(
  usageLog: { weaponId: string; minutes: number; timestamp: number }[],
  weaponId: string,
  activeWeaponIds: string[],
  now: number = Date.now(),
): WeaponBalanceInfo {
  const cutoff = now - WEAPON_BALANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const activeSet = new Set(activeWeaponIds)
  const recent = usageLog.filter(e => e.timestamp >= cutoff && activeSet.has(e.weaponId))

  const activeCount = Math.max(1, activeWeaponIds.length)
  const idealShare = 1 / activeCount
  const totalMinutes = recent.reduce((sum, e) => sum + e.minutes, 0)
  const minutes = recent.filter(e => e.weaponId === weaponId).reduce((sum, e) => sum + e.minutes, 0)

  const warm = totalMinutes >= activeCount * WEAPON_BALANCE_WARMUP_MINUTES_PER_WEAPON
  if (!warm) return { mult: 1, ratio: totalMinutes > 0 ? minutes / totalMinutes : 0, idealShare, minutes, totalMinutes, warm: false }

  const ratio = minutes / totalMinutes
  const relativeDeviation = (ratio - idealShare) / idealShare        // -1 (never used) … +∞ (only one used)
  const clamped = Math.max(-1, Math.min(3, relativeDeviation))
  const mult = Math.max(WEAPON_BALANCE_MIN_MULT, Math.min(WEAPON_BALANCE_MAX_MULT, 1 - WEAPON_BALANCE_SCALE * clamped))
  return { mult, ratio, idealShare, minutes, totalMinutes, warm: true }
}
