// Badge generation in atomicMove.ts reads from these records at moveset-creation time
// (English, stored as badge.label/detail fallback).  Locale-aware UI components should
// use getT(locale).content.* from src/i18n/index.ts instead.

import type { ContentEntry } from '../i18n/types'
import type { AtomicOrigin, StyleType, StatusType } from '../types/game'
import en from '../i18n/en'

export type { ContentEntry }

export const CONTENT_ORIGIN_INFO = en.content.origin
export const STYLE_INFO        = en.content.style
export const STATUS_INFO          = en.content.status
export const STAGE_INFO           = en.content.stage
export const PRODUCT_INFO         = en.content.product

// Backward-compatible string exports
export const CONTENT_ORIGIN_LABELS = Object.fromEntries(
  (Object.entries(CONTENT_ORIGIN_INFO) as [AtomicOrigin, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<AtomicOrigin, string>

export const STYLE_CONTENT = Object.fromEntries(
  (Object.entries(STYLE_INFO) as [StyleType, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<StyleType, string>

export const STATUS_CONTENT = Object.fromEntries(
  (Object.entries(STATUS_INFO) as [StatusType, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<StatusType, string>
