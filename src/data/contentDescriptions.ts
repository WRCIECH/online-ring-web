import type { AtomicOrigin, DamageType, StatusType } from '../types/game'

export type ContentEntry = {
  /** Short label shown inline in the UI */
  label: string
  /** Full explanation of what this means for real content */
  detail: string
  /** Concrete example */
  example: string
}

// ─── Content origin ─────────────────────────────────────────────────────────

export const CONTENT_ORIGIN_INFO: Record<AtomicOrigin, ContentEntry> = {
  New: {
    label:   'Original — created from scratch',
    detail:  'You start with a blank canvas. The idea, angle, format, and execution are entirely yours with no prior version to reference.',
    example: 'Writing a brand-new essay on a topic you have never covered before.',
  },
  Compression: {
    label:   'Compression — same idea, shorter & tighter',
    detail:  'Take an existing piece and distil it to its essential message. Remove everything non-essential — tighten sentences, cut tangents, increase density.',
    example: 'Turning a 2000-word article into a punchy 280-character tweet thread.',
  },
  Expansion: {
    label:   'Expansion — same idea, more elaborate',
    detail:  'Take a short piece and grow it into something deeper. Add context, examples, research, and nuance the original format could not hold.',
    example: 'Expanding a tweet thread into a full blog post with supporting data and case studies.',
  },
  Recycled: {
    label:   'Recycle — platform pivot, new format',
    detail:  'Move the same core content to a different platform or format without changing the message. Adapt tone and structure to fit the new context.',
    example: 'Turning a YouTube video script into a LinkedIn carousel post.',
  },
  Remastered: {
    label:   'Remaster — rework of existing content',
    detail:  'Take an older piece and polish it to current standards. Update data, improve clarity, modernise references — same bones, better execution.',
    example: 'Refreshing a 3-year-old blog post with updated statistics and improved formatting.',
  },
  Revamped: {
    label:   'Revamp — updated with new elements',
    detail:  'Keep the foundation but inject new angles, examples, or perspectives not in the original. The core idea evolves rather than just being cleaned up.',
    example: 'Adding a new chapter to an existing guide based on reader questions received since publication.',
  },
  Reboot: {
    label:   'Reboot — same idea, completely fresh start',
    detail:  'Start over from scratch on a topic you have covered before. Ignore the original execution entirely — bring a new voice, angle, or structure to the same subject.',
    example: 'Rewriting your most popular post from two years ago as if you were writing it for the first time today.',
  },
  ZoomIn: {
    label:   'Zoom In — deep focus on one inner element',
    detail:  'Take a single sub-topic or detail from a broader piece and give it its own dedicated treatment. Go deep on what was previously a footnote.',
    example: 'Pulling one concept from a "10 productivity tips" post and writing an entire standalone piece about that single idea.',
  },
  ZoomOut: {
    label:   'Zoom Out — bigger picture perspective',
    detail:  'Step back from a specific topic and contextualise it within a much larger frame. Connect dots across industries, time periods, or disciplines.',
    example: 'Taking a post about one product launch and connecting it to a broader five-year industry shift.',
  },
  AudienceAlter: {
    label:   'Audience Alter — same content, different target',
    detail:  'Reframe the same message for a completely different reader. Adjust vocabulary, assumed knowledge, examples, and tone to fit who you are now speaking to.',
    example: 'Rewriting a developer tutorial for a non-technical business audience who needs the same insight without the jargon.',
  },
  Commentary: {
    label:   'Commentary — your take on existing content',
    detail:  'Respond to, analyse, or riff on something someone else created. Your value is your perspective and interpretation layered on top of theirs.',
    example: 'Writing a response to a viral article, explaining where you agree, disagree, or see something the author missed entirely.',
  },
}

// ─── Damage type ─────────────────────────────────────────────────────────────

export const DMG_TYPE_INFO: Record<DamageType, ContentEntry> = {
  standard: {
    label:   'Universal — no particular style requirement',
    detail:  'No specific stylistic constraint. Works with any topic, format, or audience. Damage comes purely from the quality of execution.',
    example: 'A well-crafted how-to post that works regardless of niche.',
  },
  strike: {
    label:   'Impact — makes people stop and think',
    detail:  'Designed to halt people mid-scroll and force a reconsideration. Usually challenges an assumption, reframes a common belief, or delivers an unexpected insight.',
    example: '"Every productivity tip you have read is optimised for the wrong goal — here is what actually matters."',
  },
  slash: {
    label:   'Sharp opinion — direct, cutting take',
    detail:  'Clear, confident, and unhesitating. You take a specific position and do not soften it. The cut comes from clarity of stance rather than aggression.',
    example: '"Long-form content is dead for discovery. Here is what replaced it and why most creators refuse to accept it."',
  },
  pierce: {
    label:   'Research — gets through defences with evidence',
    detail:  'Evidence-based content that bypasses emotional resistance with data, studies, or documented proof. Convinces even sceptical, resistant readers.',
    example: 'A breakdown of 50 A/B tests proving which headline patterns consistently get more clicks across industries.',
  },
  lightning: {
    label:   'Viral / Fast — rides trends or urgency',
    detail:  'Latches onto breaking news, a trending topic, or a cultural moment. Speed and relevance are the weapon — the window is short and often closes within hours.',
    example: 'Publishing a sharp take on a trending topic within hours of it breaking.',
  },
  fire: {
    label:   'Urgency — hot topic, time-sensitive',
    detail:  'Creates a sense of immediate stakes or time pressure. Readers feel they must consume or act now before missing out or falling irreversibly behind.',
    example: '"The algorithm change happening this week that will quietly destroy reach for most creators."',
  },
  magic: {
    label:   'Educational — teaches or explains something new',
    detail:  'Delivers genuine new knowledge. The reader finishes knowing or being able to do something they could not before.',
    example: 'A step-by-step walkthrough of a specific skill with clear before-and-after outcomes the reader can replicate.',
  },
  holy: {
    label:   'Evergreen — timeless, stays relevant long-term',
    detail:  'Content that remains valuable long after publication. Not tied to news cycles or trends — it returns traffic, shares, and referrals for years.',
    example: 'A foundational guide to a craft that is as useful today as it will be in five years.',
  },
  occult: {
    label:   'Niche — serves a specific, devoted audience',
    detail:  'Speaks directly and specifically to a narrow audience. Outsiders will not understand it; insiders feel like it was written exactly for them.',
    example: 'A deep-dive post that only makes complete sense to someone three years into a very specific profession or hobby.',
  },
  grafting: {
    label:   'Hybrid — combines formats or disciplines',
    detail:  'Merges concepts, aesthetics, or communities that do not usually mix. The novelty comes from the unexpected combination — something neither field could produce alone.',
    example: 'Applying game theory to content strategy, or mixing literary criticism with data visualisation.',
  },
  poison: {
    label:   'Slow-burn — builds over time, lingers in mind',
    detail:  'Does not hit immediately but accumulates in the reader\'s mind. They think about it for days and keep returning to it, sharing it weeks after first reading.',
    example: 'A philosophical piece on creative work that people screenshot, save, and send to friends long after it was published.',
  },
}

// ─── Status effect ───────────────────────────────────────────────────────────

export const STATUS_INFO: Record<StatusType, ContentEntry> = {
  bleed: {
    label:   'Viral / Brainrot — hooks that spread uncontrollably',
    detail:  'Hooks so sticky they replicate without effort. Memes, earworms, repeatable phrases — designed to be copied across audiences and platforms by others.',
    example: 'A catchphrase or framing device that gets borrowed and remixed by dozens of other creators.',
  },
  scarlet_rot: {
    label:   'Polarisation — tribal, divides the audience',
    detail:  'Deliberately draws a hard line and forces the audience to pick a side. Some love it deeply; others are pushed away entirely. Engagement spikes but so does unfollowing.',
    example: '"Hustle culture is a scam" — immediately splits every room it enters.',
  },
  frostbite: {
    label:   'Envy / Hate-watching — makes people strangely obsessed',
    detail:  'Compels people to keep watching even though it frustrates or unsettles them. The pull is psychological — they cannot look away even when they want to.',
    example: 'Flexing results or lifestyle in a way that is aspirational enough to fascinate and infuriating enough to obsess over.',
  },
  madness: {
    label:   'Controversy / Hot Take — strong reaction, risks backlash',
    detail:  'A bold, risky claim that could easily blow up in your face. High engagement ceiling, high potential for backlash. Requires real confidence to deliver without hedging.',
    example: '"NFTs saved the art world and no one will admit it."',
  },
  sleep: {
    label:   'Comfort Content — relaxing, safe, parasocial warmth',
    detail:  'Warm, low-stakes content that makes the audience feel cosy and connected. Not meant to challenge — meant to become a comfortable habit they look forward to.',
    example: 'A regular "week in my creative life" update that fans treat as a reliable weekly ritual.',
  },
  death_blight: {
    label:   'Drama / Cancel Culture — explosive, ends things',
    detail:  'Content that publicly calls something or someone out. Explosive reach, but carries genuine risk. Can end careers — including, if misjudged, your own.',
    example: 'A public critique of a prominent figure in your industry, naming names and providing receipts.',
  },
  glintstone: {
    label:   'Education — genuine new knowledge delivered',
    detail:  'Dense, meaty, knowledge-rich content. Respected, bookmarked, and referenced. Attracts a serious audience willing to invest real time in learning.',
    example: 'A comprehensive framework or glossary that becomes a go-to reference document in your field.',
  },
  frenzy_flame: {
    label:   'Humour / Satire / Roast — laughter as weapon',
    detail:  'Content that makes people laugh. Softens hard truths or attacks ideas without direct confrontation. Extremely shareable when it lands, forgettable when it does not.',
    example: 'A satirical press release announcing an obviously absurd content trend as if it were serious industry news.',
  },
  devotion: {
    label:   'Parasocial Bond — audience feels personally connected',
    detail:  'Content that makes the audience feel they personally know you. You share enough of yourself that they become invested in you as a person, not just your work.',
    example: 'A candid behind-the-scenes post about your creative failures that makes readers genuinely root for you.',
  },
  yearning: {
    label:   'FOMO / Desire — makes people feel they must not miss this',
    detail:  'Creates a gap between where the reader is and where they want to be. Makes them feel they absolutely cannot afford to miss what you are offering.',
    example: '"This framework took me three years to figure out. Here is the shortcut I wish I had found earlier."',
  },
  dread: {
    label:   'Anxiety / Doomscrolling — taps into fear and uncertainty',
    detail:  'Taps into fears about falling behind, missing out, or becoming obsolete. High engagement driven by the discomfort of the reader\'s current situation.',
    example: '"If you are still doing X, you are already behind — and you may not know it yet."',
  },
  murmur: {
    label:   'Rumour / Intrigue — whispers that spread and multiply',
    detail:  'Hints at something without stating it directly. Builds intrigue and speculation. Readers share it because they want others to help them decode it.',
    example: 'A cryptic post hinting at a major announcement before anything is officially confirmed.',
  },
  grace: {
    label:   'Wholesome / Inspiration — lifts people up',
    detail:  'Content that makes people feel better about themselves, their work, and their community. Shares wins, encourages persistence, and celebrates others genuinely.',
    example: 'A post celebrating a follower\'s milestone and crediting the community that helped make it possible.',
  },
}

// ─── Backward-compatible string exports ─────────────────────────────────────

export const CONTENT_ORIGIN_LABELS = Object.fromEntries(
  (Object.entries(CONTENT_ORIGIN_INFO) as [AtomicOrigin, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<AtomicOrigin, string>

export const DMG_TYPE_CONTENT = Object.fromEntries(
  (Object.entries(DMG_TYPE_INFO) as [DamageType, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<DamageType, string>

export const STATUS_CONTENT = Object.fromEntries(
  (Object.entries(STATUS_INFO) as [StatusType, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<StatusType, string>
