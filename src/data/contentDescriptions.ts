import type { AtomicOrigin, AtomicStage, AtomicMedium, DamageType, StatusType } from '../types/game'

export type ContentEntry = {
  /** Short chip label used in badge rendering */
  badge_label: string
  /** Full UI label shown in info panels and tooltips */
  label: string
  /** Explanation of what this means for real content */
  detail: string
  /** Concrete example */
  example: string
}

// ─── Content origin ──────────────────────────────────────────────────────────

export const CONTENT_ORIGIN_INFO: Record<AtomicOrigin, ContentEntry> = {
  New: {
    badge_label: 'New Content',
    label:       'Original — created from scratch',
    detail:      'You start with a blank canvas. The idea, angle, format, and execution are entirely yours with no prior version to reference.',
    example:     'Writing a brand-new essay on a topic you have never covered before.',
  },
  Compression: {
    badge_label: 'Compress Content',
    label:       'Compression — same idea, shorter & tighter',
    detail:      'Take an existing piece and distil it to its essential message. Remove everything non-essential — tighten sentences, cut tangents, increase density.',
    example:     'Turning a 2000-word article into a punchy 280-character tweet thread.',
  },
  Expansion: {
    badge_label: 'Expand Content',
    label:       'Expansion — same idea, more elaborate',
    detail:      'Take a short piece and grow it into something deeper. Add context, examples, research, and nuance the original format could not hold.',
    example:     'Expanding a tweet thread into a full blog post with supporting data and case studies.',
  },
  Recycled: {
    badge_label: 'Recycle Content',
    label:       'Recycle — platform pivot, new format',
    detail:      'Move the same core content to a different platform or format without changing the message. Adapt tone and structure to fit the new context.',
    example:     'Turning a YouTube video script into a LinkedIn carousel post.',
  },
  Remastered: {
    badge_label: 'Remaster Content',
    label:       'Remaster — rework of existing content',
    detail:      'Take an older piece and polish it to current standards. Update data, improve clarity, modernise references — same bones, better execution.',
    example:     'Refreshing a 3-year-old blog post with updated statistics and improved formatting.',
  },
  Revamped: {
    badge_label: 'Templated Content',
    label:       'Templated — updated with new elements',
    detail:      'Keep the foundation/skeleton and fill it with new content.',
    example:     'Create thumbnail with same text position/colors - just replace the text.',
  },
  Reboot: {
    badge_label: 'Reboot Content',
    label:       'Reboot — same idea, completely fresh start',
    detail:      'Start over from scratch on a topic you have covered before. Ignore the original execution entirely — bring a new voice, angle, or structure to the same subject.',
    example:     'Rewriting your most popular post from two years ago as if you were writing it for the first time today.',
  },
  ZoomIn: {
    badge_label: 'Zoom In Content',
    label:       'Zoom In — deep focus on one inner element',
    detail:      'Take a single sub-topic or detail from a broader piece and give it its own dedicated treatment. Go deep on what was previously a footnote.',
    example:     'Pulling one concept from a "10 productivity tips" post and writing an entire standalone piece about that single idea.',
  },
  ZoomOut: {
    badge_label: 'Zoom Out Content',
    label:       'Zoom Out — bigger picture perspective',
    detail:      'Step back from a specific topic and contextualise it within a much larger frame. Connect dots across industries, time periods, or disciplines.',
    example:     'Taking a post about one product launch and connecting it to a broader five-year industry shift.',
  },
  AudienceAlter: {
    badge_label: 'Reframe Content',
    label:       'Audience Alter — same content, different target',
    detail:      'Reframe the same message for a completely different reader. Adjust vocabulary, assumed knowledge, examples, and tone to fit who you are now speaking to.',
    example:     'Rewriting a developer tutorial for a non-technical business audience who needs the same insight without the jargon.',
  },
  Commentary: {
    badge_label: 'React to Content',
    label:       'Commentary — your take on existing content',
    detail:      'Respond to, analyse, or riff on something someone else created. Your value is your perspective and interpretation layered on top of theirs.',
    example:     'Writing a response to a viral article, explaining where you agree, disagree, or see something the author missed entirely.',
  },
}

// ─── Damage type ─────────────────────────────────────────────────────────────

export const DMG_TYPE_INFO: Record<DamageType, ContentEntry> = {
  standard: {
    badge_label: 'Minimalism Style',
    label:       'Standard - Transparency/Minimalism Style',
    detail:      'Deliver a raw, direct message with pure, unfiltered facts and no extra fluff.',
    example:     'Publishing a simple, unedited text post sharing raw revenue numbers without any marketing spin.',
  },
  strike: {
    badge_label: 'Shock Style',
    label:       'Striking - Sensory Shock Style',
    detail:      'Write aggressively using caps lock, exclamation marks, and short, punchy, fragmented sentences.',
    example:     'Tweeting "THIS CHANGES EVERYTHING!!! INDIE DEV IS DEAD!!!" to instantly grab attention.',
  },
  slash: {
    badge_label: 'Narrative Style',
    label:       'Slashing - Narrative/Storytelling Style',
    detail:      'Build a smooth story structure with compelling character arcs and clear thematic narrative threads.',
    example:     "Scripting a video essay that frames a tech company's history as a classic tragic fall from grace.",
  },
  pierce: {
    badge_label: 'Segmentation Style',
    label:       'Piercing - Segmentation/Lists & Rankings Style',
    detail:      'Break the content down into bullet points, comparison tables, rankings, and S-Tier charts.',
    example:     'Creating an infographic ranking the top 10 productivity tools from S-Tier to F-Tier.',
  },
  lightning: {
    badge_label: 'Speed Style',
    label:       'Lightening - Reflex & Speed Style',
    detail:      'Use ultra-short forms to deliver the absolute essence of a breaking news event in just 2–3 sentences.',
    example:     'Posting a rapid 30-second Shorts video reacting to a major industry platform buyout within minutes of the news breaking.',
  },
  fire: {
    badge_label: 'Passion Style',
    label:       'Fire - Passion/Emotional Expression Style',
    detail:      'Use a style packed with emotional epithets, making it clear to the audience that the author is "on fire" with enthusiasm.',
    example:     'Recording a passionate, high-energy monologue defending a niche art form you absolutely adore.',
  },
  magic: {
    badge_label: 'Intellectual Style',
    label:       'Magic - Intellect/Deep Analysis Style',
    detail:      'Adopt an erudite, scholarly tone to deeply break down complex topics into their fundamental core elements.',
    example:     'Writing a detailed, long-form analytical essay breaking down the psychological traps of algorithmic loops.',
  },
  holy: {
    badge_label: 'Solve Problem Style',
    label:       'Holy - Solving Problem Focus Style',
    detail:      'Provide ready-made, highly practical recipes for problem-solving topics: profit, status, wealth, self-improvement etc.',
    example:     'Publishing a comprehensive, step-by-step blueprint on how to secure your first five freelance clients.',
  },
  occult: {
    badge_label: 'Esthetics Style',
    label:       'Occult - Esthetics/Vibe Style',
    detail:      'Cultivate a mesmerizing atmosphere using sophisticated language and the sensory beauty of pure form.',
    example:     'Producing a beautifully shot cinematic video with poetic narration and lo-fi lighting about urban isolation.',
  },
  grafting: {
    badge_label: 'Interactivity Style',
    label:       'Grafted - Interactivity with Audience Style',
    detail:      'Actively drag the audience into the creation process through Q&As, community polls, and viewer choices.',
    example:     'Hosting a live stream where the chat votes in real-time on which thumbnail design you should use.',
  },
  poison: {
    badge_label: 'Cliffhanger Style',
    label:       'Poison - Cliffhanger/Hook/Clickbait Style',
    detail:      'Construct text entirely based on insinuations, intentionally rationing out info with the promise of a resolution at the very end.',
    example:     'Titling a video "They tried to ruin me, so here is the truth..." and holding the crucial evidence until the final minute.',
  },
}

// ─── Status effect ────────────────────────────────────────────────────────────

export const STATUS_INFO: Record<StatusType, ContentEntry> = {
  bleed: {
    badge_label: 'Viral',
    label:       'Trigger Emotion on Viral/Brainrot',
    detail:      'Bleed — Weaponize a catchy, memetic construct that spreads instantly, causing a sudden "hemorrhage" of massive views once the bar fills.',
    example:     'Creating an absurd, highly loopable meme template that gets remixed across social media, exploding your metrics.',
  },
  scarlet_rot: {
    badge_label: 'Polarise',
    label:       'Trigger Emotion on Social Polarisation',
    detail:      'Scarlet Rot — Intentionally pit opposing groups against each other, rotting the social fabric and trapping viewers in radical, aggressive echo chambers.',
    example:     'Publishing a highly provocative video debating politics or lifestyle choices, triggering an endless, bitter flame war in the comments.',
  },
  frostbite: {
    badge_label: 'Envy',
    label:       'Trigger Emotion on Envy/Hate-watching',
    detail:      'Frostbite — Flex extreme luxury or a highly controversial lifestyle, causing the viewer to freeze with jealousy but keep watching just to see you fail.',
    example:     'Vlogging an overly lavish, expensive studio upgrade tour, driving bitter competitors to obsessively hate-watch your channel.',
  },
  madness: {
    badge_label: 'Hot Take',
    label:       'Trigger Emotion on Controversy/Hot Take',
    detail:      'Madness — Deliver a radical, uncompromising opinion that drives the comment section into absolute insanity and all-out war.',
    example:     'Dropping an incredibly unhinged critique of a beloved community icon, causing total chaos among your fanbase.',
  },
  sleep: {
    badge_label: 'Comfort',
    label:       'Trigger Emotion on Comfort Content/Relaxation',
    detail:      'Sleep — Produce safe, calming, and soothing content (like ASMR or Lo-Fi) that builds deep audience loyalty and peaceful vibes.',
    example:     'Streaming a quiet, cozy 4-hour co-working session with soft background rain sounds to pacify anxious viewers.',
  },
  death_blight: {
    badge_label: 'Drama',
    label:       'Trigger Emotion on Drama/Cancel Culture',
    detail:      "Death Blight — Deliver a merciless, exposing whistleblower strike designed to completely and permanently annihilate the target's career.",
    example:     'Dropping an unassailable documentary with hard receipts that completely shuts down a malicious public figure.',
  },
  glintstone: {
    badge_label: 'Wow',
    label:       'Trigger Emotion on Wow Effect/Education',
    detail:      'Glintstone — Share science, space facts, or deep world mechanisms, triggering an intellectual "Wow!" effect from the audience.',
    example:     "Creating an elegantly animated short explaining how quantum computing actually works in layman's terms.",
  },
  frenzy_flame: {
    badge_label: 'Humour',
    label:       'Trigger Emotion on Humour/Satire/Roast',
    detail:      'Frenzy Flame — Deliver pure comedy, jokes, and parodies to completely relax, loosen up, and entertain the audience.',
    example:     'Uploading a hilarious sketch mocking the generic tropes of self-help influencers, making the whole community laugh.',
  },
  devotion: {
    badge_label: 'Devotion',
    label:       'Trigger Emotion through Parasocial Bond',
    detail:      'Devotion — Share deeply intimate confessions and eliminate boundaries to foster blind devotion and loyalty among your core fans.',
    example:     'Hosting a vulnerable, late-night heart-to-heart stream talking openly about your personal failures and thanking your fans.',
  },
  yearning: {
    badge_label: 'FOMO',
    label:       'Trigger Emotion on FOMO/Desire',
    detail:      'Yearning — Intentionally trigger an intense fear of missing out on something highly limited or exclusive.',
    example:     'Announcing a merch drop that will only be available for exactly 24 hours, inducing panic-buying among followers.',
  },
  dread: {
    badge_label: 'Anxiety',
    label:       'Trigger Emotion on Anxiety/Doomscrolling',
    detail:      'Dread — Scare the audience with looming crises, economic collapses, or wars, paralyzing the viewer so they are terrified to close the tab.',
    example:     'Publishing a grim video titled "Why the market is about to collapse tomorrow," trapping viewers in a loop of panicked scrolling.',
  },
  murmur: {
    badge_label: 'Intrigue',
    label:       'Trigger Emotion on Rumour/Intrigue',
    detail:      'Murmur — Whisper behind-the-scenes rumors and drop vague insinuations to lay the groundwork for a massive upcoming drama explosion.',
    example:     'Leaking a cryptic, redacted screenshot from a corporate email on Discord, making the target highly vulnerable to a future Cancel attack.',
  },
  grace: {
    badge_label: 'Wholesome',
    label:       'Trigger Emotion on Wholesome/Inspiration/Hope',
    detail:      "Grace — Focus on philanthropy, good deeds, and pure motivation, fully restoring the viewer's faith in humanity.",
    example:     'Documenting a genuine community charity project where you help rebuild a local park, filling the audience with pure hope.',
  },
}

// ─── Stage (Phase) ───────────────────────────────────────────────────────────

export const STAGE_INFO: Record<AtomicStage, ContentEntry> = {
  Research: {
    badge_label: 'Research Stage',
    label:       'Research — gather evidence and reference',
    detail:      'Actively gather evidence, examples, and reference material.',
    example:     'Reading three competing articles before starting your own piece.',
  },
  Outline: {
    badge_label: 'Outline Stage',
    label:       'Outline — map the structure first',
    detail:      'Plan the full structure before writing a word.',
    example:     'Creating a numbered list of sections and the key point of each before drafting.',
  },
  Produce: {
    badge_label: 'Produce Stage',
    label:       'Produce — write the first draft',
    detail:      'Write your raw first draft — commit without stopping.',
    example:     'Setting a timer and writing continuously until the draft is done, no backspace.',
  },
  Glue: {
    badge_label: 'Glue Stage',
    label:       'Glue — connect pieces into a whole',
    detail:      'Connect and order pieces into a coherent narrative.',
    example:     'Stitching together separate sections with transitions and a unifying thread.',
  },
  Refine: {
    badge_label: 'Refine Stage',
    label:       'Refine — cut and elevate',
    detail:      'Cut the fat, tighten sentences, and elevate the writing.',
    example:     'Reading your draft out loud and cutting every sentence that slows the pace.',
  },
  Publish: {
    badge_label: 'Publish Stage',
    label:       'Publish — release to the world',
    detail:      'Format, finalise, and commit to releasing.',
    example:     'Adding the thumbnail, writing the meta description, and hitting publish.',
  },
}

// ─── Medium ───────────────────────────────────────────────────────────────────

export const MEDIUM_INFO: Record<AtomicMedium, ContentEntry> = {
  Writing: {
    badge_label: 'Text Medium',
    label:       'Text — text-based format',
    detail:      'Written content — articles, posts, essays, scripts, or any text-based format.',
    example:     'A long-form newsletter issue, blog post, or Twitter/X thread.',
  },
  Audio: {
    badge_label: 'Audio Medium',
    label:       'Audio — spoken or recorded sound',
    detail:      'Produce or record audio — podcast, voice note, or narration.',
    example:     'Recording a podcast episode or a voice-memo brain dump.',
  },
  Video: {
    badge_label: 'Video Medium',
    label:       'Video — moving image content',
    detail:      'Create video content — record, edit, or script for video.',
    example:     'Filming and editing a YouTube video or a short-form Reel/TikTok.',
  },
  Image: {
    badge_label: 'Image Medium',
    label:       'Image — visual or graphic',
    detail:      'Create or source visuals — graphics, photos, or illustrations.',
    example:     'Designing a single-image carousel slide or sourcing a hero photo.',
  }
}

// ─── Backward-compatible string exports ──────────────────────────────────────

export const CONTENT_ORIGIN_LABELS = Object.fromEntries(
  (Object.entries(CONTENT_ORIGIN_INFO) as [AtomicOrigin, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<AtomicOrigin, string>

export const DMG_TYPE_CONTENT = Object.fromEntries(
  (Object.entries(DMG_TYPE_INFO) as [DamageType, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<DamageType, string>

export const STATUS_CONTENT = Object.fromEntries(
  (Object.entries(STATUS_INFO) as [StatusType, ContentEntry][]).map(([k, v]) => [k, v.label])
) as Record<StatusType, string>
