// Badge generation in atomicMove.ts reads from these records at moveset-creation time
// (English, stored as badge.label/detail fallback).  Locale-aware UI components should
// use getT(locale).content.* from src/i18n/index.ts instead.

import type { ContentEntry } from '../i18n/types'
import type { ContentTransformation, EmotionType } from '../types/game'
import en from '../i18n/en'

export type { ContentEntry }

export const CONTENT_TRANSFORMATION_INFO = en.content.transformation
export const EMOTION_INFO                = en.content.emotion
export const STAGE_INFO                  = en.content.stage
export const PRODUCT_INFO                = en.content.product

export const CONTENT_TRANSFORMATION_LABELS = Object.fromEntries(
  (Object.entries(CONTENT_TRANSFORMATION_INFO) as [ContentTransformation, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<ContentTransformation, string>

export const STATUS_CONTENT = Object.fromEntries(
  (Object.entries(EMOTION_INFO) as [EmotionType, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<EmotionType, string>
